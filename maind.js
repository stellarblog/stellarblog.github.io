// DOM Elements
    const authSection = document.getElementById('authSection');
    const editorSection = document.getElementById('editorSection');
    const userInfo = document.getElementById('userInfo');
    const userName = document.getElementById('userName');
    const alertMessage = document.getElementById('alertMessage');
    const logoutBtn = document.getElementById('logoutBtn');

    // Auth tabs
    const authTabs = document.querySelectorAll('.auth-tab');
    const authForms = document.querySelectorAll('.auth-form');

    // Blog editor elements
    const blogTitle = document.getElementById('blogTitle');
    const blogExcerpt = document.getElementById('blogExcerpt');
    const blogCategory = document.getElementById('blogCategory');
    const blogAuthor = document.getElementById('blogAuthor');
    const blogReadTime = document.getElementById('blogReadTime');
    const blogImage = document.getElementById('blogImage');
    const blogContent = document.getElementById('blogContent');
    const previewContent = document.getElementById('previewContent');
    const previewBtn = document.getElementById('previewBtn');
    const saveBtn = document.getElementById('saveBtn');
    const blogsList = document.getElementById('blogsList');

    // Auth tab switching
    authTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.getAttribute('data-tab');
            
            // Update active tab
            authTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // Show corresponding form
            authForms.forEach(form => {
                form.classList.remove('active');
                if (form.getAttribute('data-type') === tabName) {
                    form.classList.add('active');
                }
            });
        });
    });

    // Preview markdown
    previewBtn.addEventListener('click', () => {
        const content = blogContent.value;
        previewContent.innerHTML = marked.parse(content || 'Preview will appear here...');
    });

    // Auto-preview when typing
    blogContent.addEventListener('input', () => {
        const content = blogContent.value;
        previewContent.innerHTML = marked.parse(content || 'Preview will appear here...');
    });

    // Save blog
    saveBtn.addEventListener('click', async () => {
        if (!isAuthenticated()) {
            showAlert('Please login to save blogs', 'error');
            return;
        }

        const title = blogTitle.value.trim();
        const excerpt = blogExcerpt.value.trim();
        const category = blogCategory.value.trim();
        const author = blogAuthor.value.trim();
        const readTime = blogReadTime.value.trim();
        const image = blogImage.value.trim();
        const content = blogContent.value.trim();

        if (!title || !excerpt || !category || !author || !readTime || !image || !content) {
            showAlert('Please fill in all fields', 'error');
            return;
        }

        try {
            saveBtn.disabled = true;
            saveBtn.textContent = 'Saving...';

            // Generate unique ID and filename
            const blogId = Date.now();
            const filename = `blog${blogId}.md`;

            // Save to localStorage (this will be accessible by the main site)
            await saveBlogToStorage(blogId, {
                id: blogId,
                title,
                excerpt,
                date: new Date().toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                }),
                image,
                category,
                readTime,
                author,
                file: filename,
                content: content
            });

            showAlert('Blog saved successfully! The main site will now show your new blog post.', 'success');
            resetForm();
            loadExistingBlogs();

        } catch (error) {
            console.error('Error saving blog:', error);
            showAlert('Error saving blog. Please try again.', 'error');
        } finally {
            saveBtn.disabled = false;
            saveBtn.textContent = 'Save Blog';
        }
    });

    // Save blog to localStorage (accessible by main site)
    async function saveBlogToStorage(blogId, blogData) {
        try {
            // Get existing blogs from localStorage
            const existingBlogs = JSON.parse(localStorage.getItem('stellar-blog-posts') || '{}');
            
            // Add new blog
            existingBlogs[blogId] = blogData;
            
            // Save back to localStorage
            localStorage.setItem('stellar-blog-posts', JSON.stringify(existingBlogs));
            
            // Also save the markdown content separately for easy access
            const blogContents = JSON.parse(localStorage.getItem('stellar-blog-contents') || '{}');
            blogContents[`blog${blogId}.md`] = blogData.content;
            localStorage.setItem('stellar-blog-contents', JSON.stringify(blogContents));
            
            return true;
        } catch (error) {
            console.error('Error saving to storage:', error);
            throw error;
        }
    }

    // Load existing blogs
    async function loadExistingBlogs() {
        try {
            // Load from original data.json first
            const response = await fetch('data.json');
            const originalData = await response.json();
            const originalPosts = originalData.posts || [];
            
            // Load from localStorage (user-created blogs)
            const storedBlogs = JSON.parse(localStorage.getItem('stellar-blog-posts') || '{}');
            const storedPosts = Object.values(storedBlogs);
            
            // Combine both arrays, with stored posts first (newest first)
            const allPosts = [...storedPosts, ...originalPosts];
            
            // Sort by ID (which is timestamp) to show newest first
            allPosts.sort((a, b) => b.id - a.id);
            
            blogsList.innerHTML = '';
            
            if (allPosts.length === 0) {
                blogsList.innerHTML = '<div class="blog-item">No blogs found. Create your first blog post!</div>';
                return;
            }
            
            allPosts.forEach(blog => {
                const blogItem = document.createElement('div');
                blogItem.className = 'blog-item';
                blogItem.innerHTML = `
                    <div class="blog-info">
                        <h4>${blog.title}</h4>
                        <div class="blog-meta">
                            ${blog.date} • ${blog.category} • ${blog.author}
                        </div>
                        <div class="blog-meta" style="font-size: 0.8rem; color: #a2c2f0; margin-top: 0.25rem;">
                            ${blog.id > 1000000000000 ? 'User Created' : 'Original'}
                        </div>
                    </div>
                    <div class="blog-actions">
                        <button class="btn btn-secondary" onclick="editBlog(${blog.id})">Edit</button>
                        <button class="btn btn-secondary" onclick="deleteBlog(${blog.id})">Delete</button>
                    </div>
                `;
                blogsList.appendChild(blogItem);
            });

        } catch (error) {
            console.error('Error loading blogs:', error);
            blogsList.innerHTML = '<div class="blog-item">Error loading blogs</div>';
        }
    }

    // Edit blog
    function editBlog(blogId) {
        // Load the blog data
        const storedBlogs = JSON.parse(localStorage.getItem('stellar-blog-posts') || '{}');
        const blog = storedBlogs[blogId];
        
        if (blog) {
            // Populate the form with existing data
            blogTitle.value = blog.title;
            blogExcerpt.value = blog.excerpt;
            blogCategory.value = blog.category;
            blogAuthor.value = blog.author;
            blogReadTime.value = blog.readTime;
            blogImage.value = blog.image;
            blogContent.value = blog.content;
            
            // Update preview
            previewContent.innerHTML = marked.parse(blog.content);
            
            showAlert('Blog loaded for editing. Click Save to update.', 'success');
        } else {
            showAlert('Blog not found for editing', 'error');
        }
    }

    // Delete blog
    function deleteBlog(blogId) {
        if (confirm('Are you sure you want to delete this blog? This action cannot be undone.')) {
            const storedBlogs = JSON.parse(localStorage.getItem('stellar-blog-posts') || '{}');
            delete storedBlogs[blogId];
            localStorage.setItem('stellar-blog-posts', JSON.stringify(storedBlogs));
            
            showAlert('Blog deleted successfully', 'success');
            loadExistingBlogs();
        }
    }

    // Reset form
    function resetForm() {
        blogTitle.value = '';
        blogExcerpt.value = '';
        blogCategory.value = '';
        blogAuthor.value = '';
        blogReadTime.value = '';
        blogImage.value = '';
        blogContent.value = '';
        previewContent.innerHTML = 'Preview will appear here...';
    }

    // Show alert message
    function showAlert(message, type) {
        alertMessage.textContent = message;
        alertMessage.className = `alert alert-${type}`;
        alertMessage.style.display = 'block';
        
        setTimeout(() => {
            alertMessage.style.display = 'none';
        }, 5000);
    }

    // Check authentication state
    function checkAuthState() {
        const user = getCurrentUser();
        if (user) {
            authSection.style.display = 'none';
            editorSection.classList.add('active');
            userInfo.classList.add('active');
            userName.textContent = user.username;
            loadExistingBlogs();
        } else {
            authSection.style.display = 'block';
            editorSection.classList.remove('active');
            userInfo.classList.remove('active');
        }
    }

    // Logout
    logoutBtn.addEventListener('click', () => {
        logout();
        checkAuthState();
        showAlert('Logged out successfully', 'success');
    });

    // Initialize
    document.addEventListener('DOMContentLoaded', () => {
        checkAuthState();
        
        // Auto-preview initial content
        previewContent.innerHTML = marked.parse(blogContent.value || 'Preview will appear here...');
    });