from supabase import create_client
import re
import os

# Configuración de Supabase
SUPABASE_URL = os.getenv("SUPABASE_URL", "https://ozvjmkvmpxxviveniuwt.supabase.co")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "your-supabase-key")

def validate_email(email):
    """
    Valida que el correo electrónico sea institucional
    
    Args:
        email (str): Correo electrónico a validar
        
    Returns:
        bool: True si el correo es válido, False en caso contrario
    """
    # Lista de dominios institucionales permitidos
    allowed_domains = [
        "universidad.edu.co",
        "unal.edu.co",
        "javeriana.edu.co",
        "unbosque.edu.co"
    ]
    
    # Validar formato básico de correo
    if not re.match(r"[^@]+@[^@]+\.[^@]+", email):
        return False
    
    # Validar dominio institucional
    domain = email.split('@')[1].lower()
    return domain in allowed_domains

def register_user(email, password, full_name):
    """
    Registra un nuevo usuario en Supabase
    
    Args:
        email (str): Correo del usuario
        password (str): Contraseña del usuario
        full_name (str): Nombre completo del usuario
        
    Returns:
        dict: Resultado de la operación
    """
    try:
        # Validar correo institucional
        if not validate_email(email):
            return {
                "success": False,
                "error": "El correo debe ser institucional"
            }
        
        # Inicializar cliente Supabase
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
        
        # Registrar usuario
        response = supabase.auth.sign_up({
            "email": email,
            "password": password
        })
        
        # Si el registro es exitoso, crear perfil
        if response.user and response.user.id:
            # Crear perfil en la tabla profiles
            profile_data = supabase.table("profiles").insert({
                "id": response.user.id,
                "email": email,
                "full_name": full_name,
                "avatar_url": None
            }).execute()
            
            return {
                "success": True,
                "user_id": response.user.id,
                "email": email
            }
        
        return {
            "success": True,
            "user_id": response["user"]["id"],
            "email": email
        }
            
    except Exception as e:
        return {
            "success": False,
            "error": f"Error al registrar usuario: {str(e)}"
        }

def login_user(email, password):
    """
    Inicia sesión de un usuario en Supabase
    
    Args:
        email (str): Correo del usuario
        password (str): Contraseña del usuario
        
    Returns:
        dict: Resultado de la operación
    """
    try:
        # Inicializar cliente Supabase
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
        
        # Iniciar sesión
        response = supabase.auth.sign_in_with_password({
            "email": email,
            "password": password
        })
        
        return {
            "success": True,
            "user": response.user,
            "session": response.session
        }
            
    except Exception as e:
        return {
            "success": False,
            "error": f"Error al iniciar sesión: {str(e)}"
        }














