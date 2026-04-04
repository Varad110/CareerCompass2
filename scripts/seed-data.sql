    -- Career Compass - Sample Data Seeding Script
    -- Run this after init-db.sql to populate initial data

    -- ============================================
    -- CAREER PROFILES
    -- ============================================

    INSERT INTO career_profiles (career_key, career_title, description, required_traits, subject_weights) VALUES

    ('software_engineer', 'Software Engineer', 
    'Design and develop software applications using cutting-edge technologies. Build scalable systems and solve complex technical problems.',
    '["logical", "technical", "analytical"]',
    '{"mathematics": 0.8, "physics": 0.6, "english": 0.4}'),

    ('data_scientist', 'Data Scientist',
    'Extract meaningful insights from data using statistical and machine learning techniques. Drive business decisions with data-driven analysis.',
    '["analytical", "logical", "technical"]',
    '{"mathematics": 0.9, "chemistry": 0.3, "english": 0.5}'),

    ('product_manager', 'Product Manager',
    'Lead product strategy, coordinate cross-functional teams, and deliver customer value. Bridge business, design, and engineering.',
    '["leadership", "communication", "analytical"]',
    '{"english": 0.8, "mathematics": 0.5, "physics": 0.2}'),

    ('ux_designer', 'UX/UI Designer',
    'Create intuitive and beautiful user experiences. Design interfaces that delight users and solve real problems.',
    '["creative", "empathy", "communication"]',
    '{"art": 0.8, "english": 0.7, "mathematics": 0.3}'),

    ('data_analyst', 'Data Analyst',
    'Analyze business data to identify trends, patterns, and opportunities. Create compelling visualizations and reports.',
    '["analytical", "technical", "logical"]',
    '{"mathematics": 0.9, "english": 0.5, "physics": 0.4}'),

    ('cybersecurity_specialist', 'Cybersecurity Specialist',
    'Protect systems and data from security threats. Implement security measures and respond to incidents.',
    '["logical", "technical", "analytical"]',
    '{"mathematics": 0.7, "physics": 0.6, "english": 0.5}'),

    ('machine_learning_engineer', 'Machine Learning Engineer',
    'Develop and deploy machine learning models to solve real-world problems. Optimize algorithms for performance.',
    '["technical", "analytical", "logical"]',
    '{"mathematics": 0.95, "physics": 0.7, "english": 0.4}'),

    ('business_analyst', 'Business Analyst',
    'Bridge the gap between business needs and technical solutions. Analyze requirements and drive improvement initiatives.',
    '["analytical", "communication", "leadership"]',
    '{"english": 0.9, "mathematics": 0.6, "economics": 0.8}');

    -- ============================================
    -- SAMPLE QUIZ QUESTIONS (20 questions)
    -- ============================================

    INSERT INTO quiz_questions (question_text, option_a, option_b, option_c, option_d, trait_a, trait_b, trait_c, trait_d, category) VALUES

    -- Interest Category
    ('What type of work excites you the most?',
    'Building software or solving technical puzzles',
    'Creating beautiful designs and user experiences',
    'Analyzing data and finding patterns',
    'Leading teams and driving business decisions',
    'technical', 'creative', 'analytical', 'leadership', 'interest'),

    ('In your spare time, you enjoy:',
    'Learning programming languages or technologies',
    'Drawing, designing, or creative projects',
    'Reading research papers or analyzing datasets',
    'Organizing people or planning events',
    'technical', 'creative', 'analytical', 'leadership', 'interest'),

    ('Which career aspect appeals to you most?',
    'Building products that impact millions',
    'Creating visual masterpieces',
    'Discovering insights from data',
    'Mentoring and managing teams',
    'technical', 'creative', 'analytical', 'leadership', 'interest'),

    ('Your ideal work environment would feature:',
    'Cutting-edge technology and innovation',
    'Creative freedom and artistic expression',
    'Data, analytics, and precision',
    'Collaboration and team dynamics',
    'technical', 'creative', 'analytical', 'leadership', 'interest'),

    ('You prefer to work on projects that are:',
    'Technically complex and challenging',
    'Visually stunning and original',
    'Backed by data and evidence',
    'Impactful for many people',
    'technical', 'creative', 'analytical', 'leadership', 'interest'),

    -- Aptitude Category
    ('When solving a difficult problem, you typically:',
    'Break it into logical steps and work systematically',
    'Try different creative approaches until something works',
    'Analyze all available data before deciding',
    'Consult with others for different perspectives',
    'logical', 'creative', 'analytical', 'social', 'aptitude'),

    ('Your strongest ability is:',
    'Understanding complex technical systems',
    'Visualizing and creating new ideas',
    'Spotting patterns and trends in information',
    'Communicating ideas clearly to others',
    'technical', 'creative', 'analytical', 'communication', 'aptitude'),

    ('In math and technical subjects, you:',
    'Excel and find them intuitive',
    'Struggle but can learn with effort',
    'Find them logical and structured',
    'Prefer practical over theoretical aspects',
    'technical', 'creative', 'analytical', 'logical', 'aptitude'),

    ('Your approach to learning new skills is:',
    'Deep dive into technical documentation',
    'Learn by experimenting and creating',
    'Study research and best practices',
    'Learn through collaboration and discussion',
    'technical', 'creative', 'analytical', 'social', 'aptitude'),

    ('When faced with data or statistics, you:',
    'Can easily interpret and find meaning',
    'Struggle but can visualize them creatively',
    'Love diving deep into analysis',
    'Prefer someone else to explain them',
    'analytical', 'creative', 'analytical', 'social', 'aptitude'),

    -- Personality Category
    ('In a team setting, you are usually the one who:',
    'Focuses on technical details and implementation',
    'Brings creative ideas and thinking outside the box',
    'Ensures data accuracy and quality',
    'Leads discussions and makes final decisions',
    'technical', 'creative', 'analytical', 'leadership', 'personality'),

    ('Your communication style is:',
    'Direct and focused on facts',
    'Expressive and detailed',
    'Precise and data-driven',
    'Empathetic and people-focused',
    'logical', 'creative', 'analytical', 'empathy', 'personality'),

    ('When mistakes happen, you:',
    'Quickly debug and find the root cause',
    'Think creatively about alternative solutions',
    'Analyze what went wrong and prevent recurrence',
    'Check in with team members about their concerns',
    'logical', 'creative', 'analytical', 'empathy', 'personality'),

    ('You feel most fulfilled when:',
    'Building something new and complex',
    'Creating something beautiful or unique',
    'Understanding everything completely',
    'Helping others achieve their goals',
    'technical', 'creative', 'analytical', 'empathy', 'personality'),

    ('Your work style is:',
    'Focused and methodical',
    'Flexible and intuitive',
    'Structured and data-based',
    'Collaborative and inclusive',
    'logical', 'creative', 'analytical', 'social', 'personality'),

    ('When given a choice, you prefer:',
    'Stability and proven technologies',
    'Innovation and new possibilities',
    'Accuracy and reliability',
    'Team harmony and consensus',
    'logical', 'creative', 'analytical', 'empathy', 'personality'),

    ('Your biggest strength is:',
    'Attention to technical detail',
    'Imagination and original thinking',
    'Critical thinking and analysis',
    'Building relationships and trust',
    'technical', 'creative', 'analytical', 'empathy', 'personality'),

    ('You learn best by:',
    'Hands-on coding and building',
    'Experimentation and discovery',
    'Reading documentation and research',
    'Discussion and group learning',
    'technical', 'creative', 'analytical', 'social', 'personality'),

    ('In conflicts, you:',
    'Focus on finding the technical solution',
    'Look for creative compromises',
    'Want to understand all facts first',
    'Prioritize everyone\'s feelings and input',
    'logical', 'creative', 'analytical', 'empathy', 'personality'),

    ('Your ideal project includes:',
    'Solving technical challenges at scale',
    'Creating something visually impressive',
    'Deep analysis and optimization',
    'Direct impact on user satisfaction',
    'technical', 'creative', 'analytical', 'empathy', 'personality');

    -- ============================================
    -- SAMPLE LEARNING RESOURCES
    -- ============================================

    INSERT INTO resources (career_key, resource_title, resource_type, description, url) VALUES

    -- Software Engineer Resources
    ('software_engineer', 'The Complete JavaScript Course 2024', 'course', 
    'Master modern JavaScript with real-world projects and best practices.',
    'https://example.com/js-course'),

    ('software_engineer', 'System Design Interview Course', 'course',
    'Learn to design large-scale systems like Netflix, Twitter, and Instagram.',
    'https://example.com/system-design'),

    ('software_engineer', 'Clean Code: A Handbook of Agile Software Craftsmanship', 'book',
    'Essential principles for writing maintainable, elegant, and professional code.',
    'https://example.com/clean-code'),

    ('software_engineer', 'AWS Certified Solutions Architect', 'certification',
    'Validate your expertise in designing scalable, reliable, and secure systems.',
    'https://example.com/aws-cert'),

    -- Data Scientist Resources
    ('data_scientist', 'Machine Learning Specialization', 'course',
    'Comprehensive ML curriculum covering supervised, unsupervised, and deep learning.',
    'https://example.com/ml-spec'),

    ('data_scientist', 'Statistics for Data Analysis', 'course',
    'Master statistical concepts essential for data science and analysis.',
    'https://example.com/stats'),

    ('data_scientist', 'Python Data Science Handbook', 'book',
    'Essential Python libraries and techniques for data manipulation and analysis.',
    'https://example.com/py-handbook'),

    ('data_scientist', 'Google Cloud Professional Data Engineer', 'certification',
    'Demonstrate expertise in designing and building data processing systems.',
    'https://example.com/gcp-cert'),

    -- Product Manager Resources
    ('product_manager', 'Product Management Essentials', 'course',
    'Learn how to lead products, work with teams, and drive business impact.',
    'https://example.com/pm-course'),

    ('product_manager', 'The Lean Product Playbook', 'book',
    'Practical guidance for building products that customers love.',
    'https://example.com/lean-product'),

    ('product_manager', 'Product Strategy and Leadership', 'course',
    'Advanced skills in product vision, strategy, and organizational leadership.',
    'https://example.com/pm-strategy'),

    -- UX Designer Resources
    ('ux_designer', 'UI/UX Design Masterclass', 'course',
    'Master the principles of user experience and interface design.',
    'https://example.com/ux-course'),

    ('ux_designer', 'The Design of Everyday Things', 'book',
    'Understand the psychology behind good and bad design.',
    'https://example.com/design-things'),

    ('ux_designer', 'Adobe XD Advanced', 'course',
    'Create professional prototypes and interactive designs.',
    'https://example.com/xd-course');

    -- ============================================
    -- COMMON TRAITS (Reference)
    -- ============================================
    -- Tracked traits:
    -- - logical: Ability to think logically and systematically
    -- - technical: Technical aptitude and programming skills
    -- - analytical: Analytical and data-driven thinking
    -- - creative: Creative and innovative thinking
    -- - artistic: Artistic and design abilities
    -- - leadership: Leadership and team management skills
    -- - communication: Communication and presentation skills
    -- - empathy: Empathy and emotional intelligence
    -- - social: Social skills and teamwork
    -- - patience: Patience and persistence

    -- ============================================
    -- NOTES
    -- ============================================
    -- 1. After inserting data, run: 
    --    SELECT * FROM quiz_questions LIMIT 5;
    --    to verify questions are loaded
    --
    -- 2. Career profiles use JSON for flexibility in subject weights and traits
    --    Example: {"mathematics": 0.8, "physics": 0.6}
    --
    -- 3. Resources should link to real courses/platforms
    --    Update URLs to point to actual learning platforms
    --
    -- 4. For production, add more questions and resources
    --    Aim for 30-50 quiz questions, 100+ resources
    --
    -- 5. Consider adding:
    --    - Interview questions per career
    --    - Company profiles
    --    - Skill progression paths
    --    - Mentorship matching data
