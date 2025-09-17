import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { stage, userId, count } = await req.json();
    const desiredCount = typeof count === 'number' && count > 0 ? Math.min(count, 10) : 5;
    
    console.log('Generating AI tasks for stage:', stage, 'userId:', userId);

    // --- PLACEHOLDER: The API key is loaded from the environment variable ---
    // DO NOT put your API key here directly!
    // Instead, set GEMINI_API_KEY in your environment variables.q
    
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      throw new Error('Gemini API key not configured');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user's previous assessments and task completion history
    const { data: assessments } = await supabase
      .from('psychological_assessments')
      .select('responses, score')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(3);

    const { data: recentTasks } = await supabase
      .from('daily_tasks')
      .select('title, description, category, is_completed')
      .eq('user_id', userId)
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false });

    // Create contextual prompt based on user data
    let contextPrompt = `Generate exactly ${desiredCount} personalized daily recovery tasks for someone in the ${stage} stage of addiction recovery.`;
    
    if (assessments && assessments.length > 0) {
      const latestScore = assessments[0].score;
      contextPrompt += ` Their latest assessment score was ${latestScore}/24.`;
    }

    if (recentTasks && recentTasks.length > 0) {
      const completionRate = (recentTasks.filter(t => t.is_completed).length / recentTasks.length * 100).toFixed(0);
      contextPrompt += ` They have a ${completionRate}% task completion rate this week.`;
    }

    const prompt = `${contextPrompt}

Stage Guidelines:
- Mild: Focus on awareness, gentle habits, early coping strategies
- Moderate: Active recovery work, stronger coping mechanisms, social support
- Severe: Intensive support, structured routines, crisis management

Return ONLY a JSON array with this exact structure:
[
  {
    "title": "Task name (max 50 chars)",
    "description": "Clear, actionable description (max 150 chars)",
    "category": "mindfulness|physical|social|reflection"
  }
]

Make tasks:
- Specific and actionable
- Appropriate for ${stage} stage
- Varied across categories
- Encouraging but realistic
- Different from recent tasks if provided`;

    console.log('Sending request to Gemini...');

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `You are a compassionate addiction recovery specialist who creates personalized daily tasks. Always respond with valid JSON only.\n\n${prompt}`
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1000,
        }
      }),
    });

    console.log('Gemini response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', errorText);
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('Gemini response received');

    let tasks;
    try {
      const geminiText = data.candidates[0].content.parts[0].text;
      tasks = JSON.parse(geminiText);
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response text');
      throw new Error('Invalid response format from AI');
    }

    // Enforce exactly desiredCount tasks
    if (!Array.isArray(tasks)) {
      tasks = [];
    }

    // Normalize shape
    tasks = tasks.map((t: any) => ({
      title: String(t.title || '').slice(0, 80),
      description: String(t.description || '').slice(0, 200),
      category: ['mindfulness','physical','social','reflection'].includes((t.category || '').toLowerCase())
        ? (t.category || '').toLowerCase()
        : 'reflection'
    }));

    // Safety check: never generate more than 5 tasks
    const maxTasks = Math.min(desiredCount, 5);
    
    // If too many, trim; if too few, top-up with simple defaults
    if (tasks.length > maxTasks) {
      tasks = tasks.slice(0, maxTasks);
    } else if (tasks.length < maxTasks) {
      const fallbackPool = [
        { title: '5-minute mindful breathing', description: 'Sit comfortably and focus on your breath for 5 minutes.', category: 'mindfulness' },
        { title: '10-minute walk', description: 'Take a short walk outdoors and notice your surroundings.', category: 'physical' },
        { title: 'Gratitude note', description: 'Write down one thing you’re grateful for today.', category: 'reflection' },
        { title: 'Support message', description: 'Send a kind message to a supportive friend/family member.', category: 'social' },
        { title: 'Hydration check', description: 'Drink a glass of water mindfully and notice how you feel.', category: 'physical' },
        { title: 'Body scan', description: 'Do a brief head-to-toe body scan, releasing tension.', category: 'mindfulness' },
      ];
      let i = 0;
      while (tasks.length < maxTasks) {
        tasks.push(fallbackPool[i % fallbackPool.length]);
        i++;
      }
    }

    // Delete today's existing tasks to avoid duplicates
    const todayIso = new Date().toISOString().split('T')[0];
    const { error: deleteError } = await supabase
      .from('daily_tasks')
      .delete()
      .eq('user_id', userId)
      .eq('date', todayIso);
    if (deleteError) {
      console.error('Error clearing existing tasks:', deleteError);
      throw deleteError;
    }

    console.log(`Cleared existing tasks for user ${userId} on ${todayIso}`);

    // Save tasks to database
    const tasksToInsert = tasks.map((task: any) => ({
      user_id: userId,
      title: task.title,
      description: task.description,
      category: task.category,
      stage: stage,
      ai_generated: true,
      date: new Date().toISOString().split('T')[0] // Today's date
    }));

    const { error: insertError } = await supabase
      .from('daily_tasks')
      .insert(tasksToInsert);

    if (insertError) {
      console.error('Database insertion error:', insertError);
      throw insertError;
    }

    console.log(`Successfully generated and saved ${tasks.length} tasks`);

    return new Response(JSON.stringify({ 
      tasks: tasks,
      message: `Generated ${tasks.length} personalized tasks for ${stage} stage recovery` 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-ai-tasks function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      details: 'Failed to generate AI tasks' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});