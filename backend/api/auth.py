# auth routes
from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
import bcrypt
import uuid
from datetime import datetime

# In a real application, this would be a database
users = {}

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    
    # Validate input
    if not data or not data.get('email') or not data.get('password'):
        return jsonify({"error": "Email va parol kiritilishi shart"}), 400
    
    email = data['email']
    password = data['password']
    
    # Check if user already exists
    if email in users:
        return jsonify({"error": "Bu email allaqachon ro'yxatdan o'tgan"}), 409
    
    # Hash password
    hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
    
    # Create user
    user_id = str(uuid.uuid4())
    users[email] = {
        'id': user_id,
        'email': email,
        'password': hashed_password,
        'created_at': datetime.now().isoformat()
    }
    
    # Create token
    access_token = create_access_token(identity=email)
    
    return jsonify({
        "message": "Foydalanuvchi muvaffaqiyatli ro'yxatdan o'tdi",
        "access_token": access_token,
        "user": {
            "id": user_id,
            "email": email
        }
    }), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    
    # Validate input
    if not data or not data.get('email') or not data.get('password'):
        return jsonify({"error": "Email va parol kiritilishi shart"}), 400
    
    email = data['email']
    password = data['password']
    
    # Check if user exists
    if email not in users:
        return jsonify({"error": "Email yoki parol noto'g'ri"}), 401
    
    user = users[email]
    
    # Verify password
    if not bcrypt.checkpw(password.encode('utf-8'), user['password']):
        return jsonify({"error": "Email yoki parol noto'g'ri"}), 401
    
    # Create token
    access_token = create_access_token(identity=email)
    
    return jsonify({
        "message": "Tizimga muvaffaqiyatli kirildi",
        "access_token": access_token,
        "user": {
            "id": user['id'],
            "email": email
        }
    }), 200

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def me():
    current_user_email = get_jwt_identity()
    user = users.get(current_user_email)
    
    if not user:
        return jsonify({"error": "Foydalanuvchi topilmadi"}), 404
    
    return jsonify({
        "user": {
            "id": user['id'],
            "email": user['email']
        }
    }), 200