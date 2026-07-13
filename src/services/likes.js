import { supabase } from '../lib/supabase/client'
export const toggleLike = async (reviewId, userId, liked) => liked ? supabase.from('review_likes').delete().eq('review_id', reviewId).eq('user_id', userId) : supabase.from('review_likes').insert({ review_id: reviewId, user_id: userId })
