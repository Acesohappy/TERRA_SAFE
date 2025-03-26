from flask import Flask, render_template, redirect, url_for, request, jsonify, session
import os
from datetime import datetime
from functools import wraps

app = Flask(__name__)
app.secret_key = os.urandom(24)  # For session management

# Temporary storage for posts (in a real app, this would be a database)
community_posts = []

# Login required decorator
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return redirect(url_for('login_page'))
        return f(*args, **kwargs)
    return decorated_function

@app.route('/')
def login_page():
    if 'user_id' in session:
        return redirect(url_for('home'))
    return render_template('login.html')

@app.route('/login', methods=['POST'])
def login():
    # Get credentials from either form data or JSON
    if request.is_json:
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')
    else:
        username = request.form.get('username')
        password = request.form.get('password')
    
    # Allow any non-empty username and password
    if username and password:
        # Set session variables
        session['user_id'] = username
        session['logged_in'] = True
        
        if request.is_json:
            return jsonify({'redirect': url_for('home')})
        return redirect(url_for('home'))
    
    # If username or password is empty
    if request.is_json:
        return jsonify({'error': 'Please enter both username and password'}), 400
    return redirect(url_for('login_page'))

@app.route('/logout')
def logout():
    # Clear all session data
    session.clear()
    return redirect(url_for('login_page'))

@app.route('/home')
@login_required
def home():
    if not session.get('logged_in'):
        return redirect(url_for('login_page'))
    return render_template('home.html')

@app.route('/hotspots')
@login_required
def hotspots():
    return render_template('hotspots.html')

@app.route('/communities')
@login_required
def communities():
    return render_template('communities.html', posts=community_posts)

@app.route('/report')
@login_required
def report():
    return render_template('report.html')

@app.route('/api/posts', methods=['POST'])
@login_required
def create_post():
    post = {
        'id': len(community_posts) + 1,
        'title': request.json.get('title'),
        'content': request.json.get('content'),
        'urgency': request.json.get('urgency'),
        'type': request.json.get('type', 'general'),
        'timestamp': datetime.now().isoformat(),
        'likes': 0,
        'comments': [],
        'author': session.get('user_id', 'Anonymous')
    }
    community_posts.append(post)
    return jsonify(post), 201

@app.route('/api/posts/<int:post_id>/like', methods=['POST'])
@login_required
def like_post(post_id):
    post = next((p for p in community_posts if p['id'] == post_id), None)
    if post:
        post['likes'] += 1
        return jsonify({'likes': post['likes']})
    return jsonify({'error': 'Post not found'}), 404

@app.route('/api/posts/<int:post_id>/comment', methods=['POST'])
@login_required
def add_comment(post_id):
    post = next((p for p in community_posts if p['id'] == post_id), None)
    if post:
        comment = {
            'id': len(post['comments']) + 1,
            'content': request.json.get('content'),
            'author': session.get('user_id', 'Anonymous'),
            'timestamp': datetime.now().isoformat()
        }
        post['comments'].append(comment)
        return jsonify(comment), 201
    return jsonify({'error': 'Post not found'}), 404

@app.route('/api/posts/filter', methods=['GET'])
@login_required
def filter_posts():
    filter_type = request.args.get('type', 'all')
    if filter_type == 'all':
        return jsonify(community_posts)
    
    # Map filter buttons to post types
    type_mapping = {
        'alerts': 'alert',
        'events': 'event',
        'sightings': 'sighting'
    }
    
    post_type = type_mapping.get(filter_type, 'general')
    filtered_posts = [p for p in community_posts if p.get('type') == post_type]
    return jsonify(filtered_posts)

if __name__ == '__main__':
    app.run(debug=True)