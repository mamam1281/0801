UPDATE users 
SET password_hash = '$2b$12$lqxzLQUjiVP8mos5FIEc9.puGEWFzT.SHqjdURWRHZCPKKWeyFxGG' 
WHERE site_id = 'admin';

SELECT id, site_id, LENGTH(password_hash) as hash_length, password_hash 
FROM users 
WHERE site_id = 'admin';
