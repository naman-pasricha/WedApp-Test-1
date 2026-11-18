// Create wedding API
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { z } from 'zod';

const createWeddingSchema = z.object({
  name: z.string().min(1).max(200),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD
});

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient();

    // Verify authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, date } = createWeddingSchema.parse(body);

    // Generate slug from name
    const baseSlug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      .substring(0, 50);

    // Ensure unique slug
    let slug = baseSlug;
    let counter = 1;
    while (true) {
      const { data: existing } = await supabase
        .from('weddings')
        .select('id')
        .eq('slug', slug)
        .maybeSingle();
      if (!existing) break;
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Create wedding with default theme
    const { data: wedding, error } = await supabase
      .from('weddings')
      .insert({
        slug,
        host_id: user.id,
        name,
        date,
        theme: {},
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ message: 'Failed to create wedding' }, { status: 500 });
    }

    // Add host record
    await supabase.from('wedding_hosts').insert({
      wedding_id: wedding.id,
      user_id: user.id,
      role: 'owner',
    });

    return NextResponse.json({ wedding });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Invalid request', errors: error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    console.error('Create wedding error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}