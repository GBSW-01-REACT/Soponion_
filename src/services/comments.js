import { supabase } from '../lib/supabase/client'
export const listComments = async (reviewId) => supabase.from('comments').select('*, profiles(id,nickname,profile_image_url)').eq('review_id', reviewId).order('created_at')
export const createComment = async (payload) => supabase.from('comments').insert(payload).select().single()
export const updateComment = async (id, content) => supabase.from('comments').update({ content }).eq('id', id).select().single()
export const deleteComment = async (id) => supabase.from('comments').delete().eq('id', id)
