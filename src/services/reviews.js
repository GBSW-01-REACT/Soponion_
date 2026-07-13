import { supabase } from '../lib/supabase/client'
const select = '*, profiles(id,nickname,profile_image_url), review_likes(user_id)'
export const listReviews = async (songId) => supabase.from('reviews').select(select).eq('song_id', songId).order('created_at', { ascending: false })
export const getReview = async (id) => supabase.from('reviews').select(select).eq('id', id).single()
export const createReview = async (payload) => supabase.from('reviews').insert(payload).select().single()
export const updateReview = async (id, payload) => supabase.from('reviews').update(payload).eq('id', id).select().single()
export const deleteReview = async (id) => supabase.from('reviews').delete().eq('id', id)
