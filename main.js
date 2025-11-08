// Initialize blog storage
        function initializeBlogStorage() {
            if (!localStorage.getItem('stellar-blog-posts')) {
                localStorage.setItem('stellar-blog-posts', JSON.stringify({}));
            }
            if (!localStorage.getItem('stellar-blog-contents')) {
                localStorage.setItem('stellar-blog-contents', JSON.stringify({}));
            }
            if (!localStorage.getItem('stellar-blog-comments')) {
                localStorage.setItem('stellar-blog-comments', JSON.stringify({}));
            }
        }

        // Load user-created blogs from localStorage
        function loadUserBlogs() {
            try {
                const storedBlogs = JSON.parse(localStorage.getItem('stellar-blog-posts') || '{}');
                return Object.values(storedBlogs);
            } catch (error) {
                console.error('Error loading user blogs:', error);
                return [];
            }
        }

        // Load user blog content
        function loadUserBlogContent(filename) {
            try {
                const blogContents = JSON.parse(localStorage.getItem('stellar-blog-contents') || '{}');
                return blogContents[filename] || null;
            } catch (error) {
                console.error('Error loading user blog content:', error);
                return null;
            }
        }

        // Blog functionality
        document.addEventListener('DOMContentLoaded', async function() {
            // Initialize storage
            initializeBlogStorage();
            
            // Load blog posts from JSON and user creations
            let posts = [];
            try {
                const response = await fetch('data.json');
                const data = await response.json();
                const originalPosts = data.posts || [];
                
                // Load user-created blogs
                const userBlogs = loadUserBlogs();
                
                console.log('Original posts:', originalPosts.length);
                console.log('User blogs:', userBlogs.length);
                
                // Combine both arrays, user blogs first (newest first)
                posts = [...userBlogs, ...originalPosts];
                
                // Sort by ID (timestamp) to show newest first
                posts.sort((a, b) => b.id - a.id);
                
            } catch (error) {
                console.error('Error loading blog posts:', error);
                document.getElementById('articles').innerHTML = '<div class="loading">Error loading blog posts</div>';
                return;
            }
            
            // Render blog posts
            const blogContainer = document.getElementById('articles');
            
            if (posts.length === 0) {
                blogContainer.innerHTML = `
                    <div class="loading" style="grid-column: 1 / -1;">
                        <p>No blog posts yet.</p>
                        <p><a href="blogeditor.html" style="color: #4a86e8;">Create your first blog post</a></p>
                    </div>
                `;
                return;
            }
            
            blogContainer.innerHTML = '';
            
            posts.forEach(post => {
                const isUserCreated = post.id > 1000000000000; // Check if it's a user-created post (timestamp-based ID)
                
                const postElement = document.createElement('article');
                postElement.className = 'post-card';
                postElement.innerHTML = `
                    <div class="post-image">${post.image}</div>
                    <div class="post-content">
                        <div class="post-date">
                            ${post.date} • ${post.category} • ${post.readTime}
                            ${isUserCreated ? '<span class="user-created-badge">New</span>' : ''}
                        </div>
                        <h2 class="post-title">${post.title}</h2>
                        <p class="post-excerpt">${post.excerpt}</p>
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <button class="read-more" data-id="${post.id}">Read More</button>
                            <span style="color: #a2c2f0; font-size: 0.9rem;">By ${post.author}</span>
                        </div>
                    </div>
                `;
                blogContainer.appendChild(postElement);
            });
            
            // Blog reader functionality
            const blogReader = document.getElementById('blogReader');
            const closeReader = document.getElementById('closeReader');
            const readerTitle = document.getElementById('readerTitle');
            const readerMeta = document.getElementById('readerMeta');
            const readerBody = document.getElementById('readerBody');
            const commentForm = document.getElementById('commentForm');
            const commentsList = document.getElementById('commentsList');
            const commentCount = document.getElementById('commentCount');
            const submitComment = document.getElementById('submitComment');
            
            let currentPostId = null;
            let comments = {};
            
            // Load comments from JSON
            async function loadComments() {
                try {
                    const response = await fetch('comments.json');
                    comments = await response.json();
                } catch (error) {
                    console.error('Error loading comments:', error);
                    comments = {};
                }
            }
            
            // Save comments to JSON
            async function saveComments() {
                try {
                    // For demo purposes, we'll use localStorage
                    localStorage.setItem('stellar-blog-comments', JSON.stringify(comments));
                    return true;
                } catch (error) {
                    console.error('Error saving comments:', error);
                    return false;
                }
            }
            
            // Load comments when page loads
            await loadComments();
            
            // Also load comments from localStorage
            const savedComments = localStorage.getItem('stellar-blog-comments');
            if (savedComments) {
                try {
                    const parsedComments = JSON.parse(savedComments);
                    comments = { ...comments, ...parsedComments };
                } catch (error) {
                    console.error('Error loading saved comments:', error);
                }
            }
            
            // Add click handlers for read more buttons
            document.querySelectorAll('.read-more').forEach(button => {
                button.addEventListener('click', async function() {
                    const postId = this.getAttribute('data-id');
                    const post = posts.find(p => p.id == postId);
                    
                    if (post) {
                        currentPostId = postId;
                        
                        // Show loading state
                        readerTitle.textContent = 'Loading...';
                        readerMeta.textContent = '';
                        readerBody.innerHTML = '<div class="loading">Loading article content...</div>';
                        commentsList.innerHTML = '<div class="loading">Loading comments...</div>';
                        blogReader.style.display = 'block';
                        document.body.style.overflow = 'hidden';
                        
                        try {
                            let markdown = '';
                            const isUserCreated = post.id > 1000000000000;
                            
                            if (isUserCreated) {
                                // Load from user-created content
                                markdown = loadUserBlogContent(post.file);
                                if (!markdown) {
                                    throw new Error('Content not found');
                                }
                            } else {
                                // Load from original markdown file
                                const response = await fetch(`${post.file}`);
                                markdown = await response.text();
                            }
                            
                            // Update reader content
                            readerTitle.textContent = post.title;
                            readerMeta.innerHTML = `
                                ${post.date} • ${post.category} • ${post.readTime}<br>
                                By ${post.author}
                                ${isUserCreated ? '<br><small style="color: #4caf50;">✓ User Created Post</small>' : ''}
                            `;
                            readerBody.innerHTML = marked.parse(markdown);
                            
                            // Load and display comments for this post
                            await displayComments(postId);
                        } catch (error) {
                            console.error('Error loading blog content:', error);
                            readerBody.innerHTML = '<div class="loading">Error loading article content</div>';
                        }
                    }
                });
            });
            
            // Display comments for a post
            async function displayComments(postId) {
                const postComments = comments[postId] || [];
                commentCount.textContent = postComments.length;
                
                if (postComments.length === 0) {
                    commentsList.innerHTML = '<div class="no-comments">No comments yet. Be the first to share your thoughts!</div>';
                    return;
                }
                
                // Sort comments by date (newest first)
                postComments.sort((a, b) => new Date(b.date) - new Date(a.date));
                
                commentsList.innerHTML = '';
                postComments.forEach(comment => {
                    const commentElement = document.createElement('div');
                    commentElement.className = 'comment';
                    commentElement.innerHTML = `
                        <div class="comment-header">
                            <div class="comment-author">${comment.name}</div>
                            <div class="comment-date">${new Date(comment.date).toLocaleDateString()} at ${new Date(comment.date).toLocaleTimeString()}</div>
                        </div>
                        <div class="comment-content">${comment.content}</div>
                    `;
                    commentsList.appendChild(commentElement);
                });
            }
            
            // Handle comment form submission
            commentForm.addEventListener('submit', async function(e) {
                e.preventDefault();
                
                if (!currentPostId) return;
                
                const name = document.getElementById('commentName').value.trim();
                const email = document.getElementById('commentEmail').value.trim();
                const content = document.getElementById('commentContent').value.trim();
                
                if (!name || !content) {
                    alert('Please fill in all required fields.');
                    return;
                }
                
                // Disable submit button
                submitComment.disabled = true;
                submitComment.textContent = 'Posting...';
                
                try {
                    // Create new comment
                    const newComment = {
                        id: Date.now().toString(),
                        name: name,
                        email: email,
                        content: content,
                        date: new Date().toISOString(),
                        postId: currentPostId
                    };
                    
                    // Add comment to local storage
                    if (!comments[currentPostId]) {
                        comments[currentPostId] = [];
                    }
                    comments[currentPostId].push(newComment);
                    
                    // Save comments
                    await saveComments();
                    
                    // Reset form
                    commentForm.reset();
                    
                    // Update comments display
                    await displayComments(currentPostId);
                    
                    // Show success message
                    alert('Comment posted successfully!');
                    
                } catch (error) {
                    console.error('Error posting comment:', error);
                    alert('Error posting comment. Please try again.');
                } finally {
                    // Re-enable submit button
                    submitComment.disabled = false;
                    submitComment.textContent = 'Post Comment';
                }
            });
            
            // Close reader
            closeReader.addEventListener('click', function() {
                blogReader.style.display = 'none';
                document.body.style.overflow = 'auto';
                currentPostId = null;
                commentForm.reset();
            });
            
            // Close reader when clicking outside content
            blogReader.addEventListener('click', function(e) {
                if (e.target === blogReader) {
                    blogReader.style.display = 'none';
                    document.body.style.overflow = 'auto';
                    currentPostId = null;
                    commentForm.reset();
                }
            });
            
            // Close reader with Escape key
            document.addEventListener('keydown', function(e) {
                if (e.key === 'Escape' && blogReader.style.display === 'block') {
                    blogReader.style.display = 'none';
                    document.body.style.overflow = 'auto';
                    currentPostId = null;
                    commentForm.reset();
                }
            });
        });

        // Three.js Neutron Star Background (same as before)
        // [Three.js code remains exactly the same as in the previous implementation]
        // Initialize scene, camera, and renderer
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ 
            antialias: true,
            alpha: true
        });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.2;
        document.getElementById('star-container').appendChild(renderer.domElement);

        // Position camera
        camera.position.z = 6;

        // Create a fully glowing star with multiple layers
        const createGlowingSphere = (radius, color, intensity, emissive) => {
            const geometry = new THREE.SphereGeometry(radius, 64, 64);
            const material = new THREE.MeshBasicMaterial({
                color: color,
                emissive: emissive,
                emissiveIntensity: intensity,
                transparent: true,
                opacity: 0.9
            });
            return new THREE.Mesh(geometry, material);
        };

        // Main star core - intense white-hot center
        const starCore = createGlowingSphere(0.8, 0xffffff, 2.0, 0xffeeaa);
        scene.add(starCore);

        // Middle layer - bright blue glow
        const starMiddle = createGlowingSphere(1.0, 0x4a86e8, 1.5, 0x2a5a9a);
        scene.add(starMiddle);

        // Outer layer - soft blue glow
        const starOuter = createGlowingSphere(1.2, 0x2a5a9a, 1.0, 0x1a3a7a);
        scene.add(starOuter);

        // Create intense corona effect
        const coronaGeometry = new THREE.SphereGeometry(1.5, 64, 64);
        const coronaMaterial = new THREE.ShaderMaterial({
            uniforms: {
                glowColor: { value: new THREE.Color(0x4a86e8) },
                time: { value: 0 }
            },
            vertexShader: `
                uniform float time;
                varying vec3 vNormal;
                void main() {
                    vNormal = normalize(normalMatrix * normal);
                    
                    // Add subtle surface movement
                    vec3 pos = position;
                    float wave = sin(time * 2.0 + position.y * 10.0) * 0.03;
                    pos += normal * wave;
                    
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
                }
            `,
            fragmentShader: `
                uniform vec3 glowColor;
                varying vec3 vNormal;
                void main() {
                    float intensity = pow(0.7 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
                    vec3 glow = glowColor * intensity;
                    gl_FragColor = vec4(glow, intensity * 0.6);
                }
            `,
            side: THREE.BackSide,
            blending: THREE.AdditiveBlending,
            transparent: true
        });
        
        const corona = new THREE.Mesh(coronaGeometry, coronaMaterial);
        scene.add(corona);

        // Create nano particles system
        const particleCount = 15000;
        const particles = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const velocities = new Float32Array(particleCount * 3);
        const lifetimes = new Float32Array(particleCount);
        const sizes = new Float32Array(particleCount);

        // Mouse interaction
        const mouse = new THREE.Vector2();
        const mouseForce = new THREE.Vector3();
        let mouseActive = false;

        // Initialize particles
        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            
            // Start particles at random positions on star surface
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            const radius = 1.2 + Math.random() * 0.1;
            
            positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
            positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
            positions[i3 + 2] = radius * Math.cos(phi);
            
            // Set initial velocity (very calm outward movement)
            const speed = 0.003 + Math.random() * 0.004;
            velocities[i3] = positions[i3] * speed;
            velocities[i3 + 1] = positions[i3 + 1] * speed;
            velocities[i3 + 2] = positions[i3 + 2] * speed;
            
            // Add slight random motion
            velocities[i3] += (Math.random() - 0.5) * 0.001;
            velocities[i3 + 1] += (Math.random() - 0.5) * 0.001;
            velocities[i3 + 2] += (Math.random() - 0.5) * 0.001;
            
            // Set lifetime
            lifetimes[i] = Math.random() * 200 + 100;
            
            // Set color - mostly white with blue tint
            const colorValue = 0.8 + Math.random() * 0.2;
            colors[i3] = colorValue; // R
            colors[i3 + 1] = colorValue * 0.9; // G
            colors[i3 + 2] = 1.0; // B
            
            // Very small sizes for nano particles
            sizes[i] = Math.random() * 0.02 + 0.005;
        }

        particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particles.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        particles.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

        // Particle material for nano particles
        const particleMaterial = new THREE.PointsMaterial({
            size: 0.01,
            vertexColors: true,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending,
            sizeAttenuation: true,
            depthWrite: false
        });

        const particleSystem = new THREE.Points(particles, particleMaterial);
        scene.add(particleSystem);

        // Add distant starfield
        const starFieldGeometry = new THREE.BufferGeometry();
        const starFieldPositions = new Float32Array(8000 * 3);
        
        for (let i = 0; i < 8000; i++) {
            const i3 = i * 3;
            starFieldPositions[i3] = (Math.random() - 0.5) * 1000;
            starFieldPositions[i3 + 1] = (Math.random() - 0.5) * 1000;
            starFieldPositions[i3 + 2] = (Math.random() - 0.5) * 1000;
        }
        
        starFieldGeometry.setAttribute('position', new THREE.BufferAttribute(starFieldPositions, 3));
        
        const starFieldMaterial = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 0.5,
            sizeAttenuation: true
        });
        
        const starField = new THREE.Points(starFieldGeometry, starFieldMaterial);
        scene.add(starField);

        // Mouse move interaction
        document.addEventListener('mousemove', (event) => {
            mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
            mouseActive = true;
        });

        document.addEventListener('mouseleave', () => {
            mouseActive = false;
        });

        // Animation variables
        let time = 0;

        // Animation loop
        function animate() {
            requestAnimationFrame(animate);
            time += 0.016;

            // Rotate the star layers at different speeds
            starCore.rotation.y += 0.003;
            starMiddle.rotation.y += 0.002;
            starOuter.rotation.y += 0.0015;
            corona.rotation.y += 0.001;

            // Update corona material
            coronaMaterial.uniforms.time.value = time;

            // Pulsating glow effect
            const pulse = Math.sin(time * 2) * 0.2 + 0.8;
            starCore.material.emissiveIntensity = 1.5 + pulse * 0.5;
            starMiddle.material.emissiveIntensity = 1.2 + pulse * 0.3;
            starOuter.material.emissiveIntensity = 0.8 + pulse * 0.2;
            
            coronaMaterial.uniforms.glowColor.value.setRGB(
                0.3 * pulse, 0.5 * pulse, 0.9 * pulse
            );

            // Calculate mouse force in 3D space
            if (mouseActive) {
                mouseForce.x = mouse.x * 0.5;
                mouseForce.y = mouse.y * 0.5;
                mouseForce.z = 0;
            } else {
                mouseForce.set(0, 0, 0);
            }

            // Animate particles
            const positions = particles.attributes.position.array;
            const colors = particles.attributes.color.array;
            
            for (let i = 0; i < particleCount; i++) {
                const i3 = i * 3;
                
                const x = positions[i3];
                const y = positions[i3 + 1];
                const z = positions[i3 + 2];
                
                // Calculate distance from center
                const distance = Math.sqrt(x*x + y*y + z*z);
                
                // Apply mouse interaction force
                if (mouseActive && distance < 4) {
                    const forceStrength = (4 - distance) * 0.0005;
                    velocities[i3] += mouseForce.x * forceStrength;
                    velocities[i3 + 1] += mouseForce.y * forceStrength;
                }
                
                // Update position
                positions[i3] += velocities[i3];
                positions[i3 + 1] += velocities[i3 + 1];
                positions[i3 + 2] += velocities[i3 + 2];
                
                // Gradually slow down particles
                velocities[i3] *= 0.998;
                velocities[i3 + 1] *= 0.998;
                velocities[i3 + 2] *= 0.998;
                
                // Update color based on distance (fade to blue)
                const distanceFactor = Math.min(1, distance / 6);
                colors[i3] = 0.8 - distanceFactor * 0.4; // R
                colors[i3 + 1] = 0.7 - distanceFactor * 0.4; // G
                colors[i3 + 2] = 1.0; // B remains strong
                
                // Fade out particles as they get farther
                const alpha = 1 - Math.min(1, distance / 8);
                colors[i3] *= alpha;
                colors[i3 + 1] *= alpha;
                colors[i3 + 2] *= alpha;
                
                // Reset particles that get too far or based on lifetime
                if (distance > 8 || lifetimes[i]-- <= 0) {
                    // Reset to surface of star
                    const theta = Math.random() * Math.PI * 2;
                    const phi = Math.acos(2 * Math.random() - 1);
                    const radius = 1.2 + Math.random() * 0.1;
                    
                    positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
                    positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
                    positions[i3 + 2] = radius * Math.cos(phi);
                    
                    // Reset velocity (calm outward movement)
                    const speed = 0.003 + Math.random() * 0.004;
                    velocities[i3] = positions[i3] * speed;
                    velocities[i3 + 1] = positions[i3 + 1] * speed;
                    velocities[i3 + 2] = positions[i3 + 2] * speed;
                    
                    // Add slight random motion
                    velocities[i3] += (Math.random() - 0.5) * 0.001;
                    velocities[i3 + 1] += (Math.random() - 0.5) * 0.001;
                    velocities[i3 + 2] += (Math.random() - 0.5) * 0.001;
                    
                    // Reset lifetime
                    lifetimes[i] = Math.random() * 200 + 100;
                    
                    // Reset color
                    const colorValue = 0.8 + Math.random() * 0.2;
                    colors[i3] = colorValue;
                    colors[i3 + 1] = colorValue * 0.9;
                    colors[i3 + 2] = 1.0;
                }
            }
            
            particles.attributes.position.needsUpdate = true;
            particles.attributes.color.needsUpdate = true;

            // Slowly rotate camera for dynamic view
            camera.position.x = Math.sin(time * 0.05) * 6;
            camera.position.z = Math.cos(time * 0.05) * 6;
            camera.lookAt(0, 0, 0);

            renderer.render(scene, camera);
        }

        // Handle window resize
        window.addEventListener('resize', () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        });

        // Start animation
        animate();
