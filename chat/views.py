from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from django.contrib.auth import logout
from django.shortcuts import get_object_or_404
from .models import Room


def custom_logout(request):
    logout(request)  # Cierra la sesión del usuario
    return redirect('login')  # Redirige al login o cualquier otra URL

@login_required
def home(request):
    rooms = Room.objects.all()
    return render(request, 'chat/home.html', {'rooms':rooms})

@login_required
def umlPage(request):
    return render(request, 'chat/umlClass.html')

@login_required
def room(request, room_id):
    room = get_object_or_404(Room, id=room_id)
    
    # Verificar si el usuario es parte de la sala con 'if not'
    if not room.users.filter(id=request.user.id).exists():
        context = {
            'error_message': 'No tiene permiso de acceso a esta sala',
            'rooms': Room.objects.all()
        }
        return render(request, 'chat/home.html', context)

    return render(request, 'chat/room.html', {'room': room})
