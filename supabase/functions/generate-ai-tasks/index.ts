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
    const { stage, userId } = await req.json();
    
    console.log('Generating AI tasks for stage:', stage, 'userId:', userId);

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
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
    let contextPrompt = `Generate 4-6 personalized daily recovery tasks for someone in the ${stage} stage of addiction recovery.`;
    
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

    console.log('Sending request to OpenAI...');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: 'You are a compassionate addiction recovery specialist who creates personalized daily tasks. Always respond with valid JSON only.' 
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('OpenAI response received');

    let tasks;
    try {
      tasks = JSON.parse(data.choices[0].message.content);
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', data.choices[0].message.content);
      throw new Error('Invalid response format from AI');
    }

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