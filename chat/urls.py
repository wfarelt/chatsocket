from django.urls import path
from django.contrib.auth.views import LoginView, LogoutView
from .views import home, room, umlPage, custom_logout

urlpatterns = [
    path('login/', LoginView.as_view(template_name='registration/login.html'), name='login'),
    path('logout/', custom_logout, name='logout'),
    path('umlPage', umlPage, name='umlPage'),
    path('', home, name='home'),
    path('room/<int:room_id>', room, name='room'),
]
