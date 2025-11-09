import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, healthData, workoutHistory } = await req.json();
    
    const authHeader = req.headers.get('Authorization')!;
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) throw new Error('No user found');

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');

    let systemPrompt = '';
    let userPrompt = '';
    let title = '';

    if (type === 'meal') {
      systemPrompt = 'You are a nutrition expert. Based on health data and workout history, provide personalized meal recommendations. Be specific and practical.';
      userPrompt = `Create a meal plan recommendation based on: Health metrics: ${JSON.stringify(healthData)}, Recent workouts: ${JSON.stringify(workoutHistory)}`;
      title = 'AI Meal Plan';
    } else if (type === 'workout') {
      systemPrompt = 'You are a fitness coach. Based on health data and workout history, provide personalized workout recommendations. Be specific with exercises, sets, and reps.';
      userPrompt = `Create a workout plan recommendation based on: Health metrics: ${JSON.stringify(healthData)}, Recent workouts: ${JSON.stringify(workoutHistory)}`;
      title = 'AI Workout Plan';
    } else if (type === 'health') {
      systemPrompt = 'You are a health specialist. Based on health data and recent workouts, provide actionable health recommendations (sleep, stress, general wellbeing, preventative tips). Be specific and practical.';
      userPrompt = `Create a health recommendation based on: Health metrics: ${JSON.stringify(healthData)}, Recent workouts: ${JSON.stringify(workoutHistory)}`;
      title = 'AI Health Recommendation';
    } else {
      // fallback to a general recommendation
      systemPrompt = 'You are an expert. Provide general recommendations based on the provided data.';
      userPrompt = `Create a recommendation based on: Health metrics: ${JSON.stringify(healthData)}, Recent workouts: ${JSON.stringify(workoutHistory)}`;
      title = 'AI Recommendation';
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'Payment required. Please add credits to your Lovable AI workspace.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error('Failed to generate recommendations');
    }

    const data = await response.json();
    const recommendation = data.choices[0].message.content;

    // Store recommendation in database
    const { data: saved, error: saveError } = await supabaseClient
      .from('ai_recommendations')
      .insert({
        user_id: user.id,
        recommendation_type: type,
        title,
        description: recommendation,
        data: { healthData, workoutHistory },
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .select()
      .single();

    if (saveError) {
      console.error('Error saving recommendation:', saveError);
      throw saveError;
    }

    return new Response(JSON.stringify({ recommendation: saved }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-recommendations:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});