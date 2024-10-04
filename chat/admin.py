from django.contrib import admin
from .models import Room, Message
# Register your models here.

class MessageAdmin(admin.ModelAdmin):
    list_display = ('user', 'room', 'message', 'timestamp')
    list_filter = ('room', 'user')

admin.site.register(Room)

admin.site.register(Message, MessageAdmin)


 