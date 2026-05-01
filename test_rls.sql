-- Function to test RLS by impersonating a user role
-- Note: This is a simulation since we can't easily mock auth.uid() in this environment without full Supabase setup,
-- but we can check the logic by manually applying the policy filters in a query.

WITH test_users AS (
  SELECT 'exec_id'::text as id, 'executive'::user_role as role, 'executive'::team_name as team
  UNION ALL SELECT 'prod_id', 'product', 'product'
  UNION ALL SELECT 'mkt_id', 'marketing', 'marketing'
  UNION ALL SELECT 'dev_id', 'engineering', 'engineering'
)
SELECT 
  u.role as simulating_role,
  t.titulo as task_title,
  t.team as task_team,
  CASE 
    WHEN u.role = 'executive' THEN 'VISIBLE (Exec sees all)'
    WHEN u.role = 'product' THEN 'VISIBLE (Product manages all)'
    WHEN u.team = t.team THEN 'VISIBLE (Team match)'
    ELSE 'HIDDEN'
  END as access_result
FROM test_users u
CROSS JOIN (
  SELECT 'Mkt Task' as titulo, 'marketing'::team_name as team
  UNION ALL SELECT 'Dev Task', 'engineering'
) t
ORDER BY simulating_role, access_result;
