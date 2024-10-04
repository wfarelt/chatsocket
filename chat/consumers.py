# consumers.py
from django.utils import timezone
import json
from channels.generic.websocket import WebsocketConsumer
from asgiref.sync import async_to_sync
from .models import Message


class ChatConsumer(WebsocketConsumer):
    #Definimos usuario conectados
    connected_users = {}
    
    def connect(self):
        self.id = self.scope['url_route']['kwargs']['room_id']
        self.room_group_name = 'sala_chat_%s' % self.id
        self.user = self.scope['user']
        
        if self.user.is_authenticated:
            self.username = self.user.username
        else:
            self.close()
            return
        
        # Agregamos al usuario al diccionario
        if self.room_group_name not in self.connected_users:
            self.connected_users[self.room_group_name] = []
            
        if self.username not in self.connected_users[self.room_group_name]:
            self.connected_users[self.room_group_name].append(self.username)            
            
        print('Conexión establecida al room_group_name: ' + self.room_group_name)
        print('Conexión establecida al channel_name: ' + self.channel_name)
        print('Usuarios conectados: ' + str(self.connected_users))
        
        async_to_sync(self.channel_layer.group_add)(self.room_group_name, self.channel_name)
        # Aceptar la conexión cuando un cliente se conecta
        self.accept()
        
        #Enviamos la lista de usuario conectados
        async_to_sync(self.channel_layer.group_send)(self.room_group_name, {
            'type': 'user_list',
            'users': self.connected_users[self.room_group_name]
        })
    
    def user_list(self, event):
        #Enviar la lista de usuario
        self.send(text_data=json.dumps({
            'type': 'user_list',
            'users': event['users']
        }))

    def disconnect(self, close_code):
        #Eliminar al usuario
        if self.username and self.username in self.connected_users[self.room_group_name]:
            self.connected_users[self.room_group_name].remove(self.username)
        
        #Enviamos la lista de usuario conectados
        async_to_sync(self.channel_layer.group_send)(self.room_group_name, {
            'type': 'user_list',
            'users': self.connected_users[self.room_group_name]
        })
        print('Usuarios conectados: ' + str(self.connected_users))
        
        async_to_sync(self.channel_layer.group_discard)(self.room_group_name, self.channel_name)
        # Desconectar el cliente cuando se cierra la conexión
        print('Se ha desconectado')
        pass

    def receive(self, text_data):
            
        if not self.scope['user'].is_authenticated:
            print('Usuario no autentificado, mensaje no procesado')
            return

        try:
            text_data_json = json.loads(text_data)
            event_type = text_data_json.get('type')
              
            handlers = {
                'addPropertyToClass': self.handle_add_property_to_class,
                'create_new_class': self.handle_create_new_class,
                'prueba': self.handle_prueba,
                'chat_message': self.handle_chat_message,
                'draw': self.handle_draw,
                'user_list': self.handle_user_list,
            }

            handler = handlers.get(event_type)
            if handler:
                handler(text_data_json)
            else:
                print(f'Tipo de evento desconocido: {event_type}')

        except json.JSONDecodeError as e:
            print(f'Error al decodificar el JSON: {str(e)}. Data recibida: {text_data}')
        except KeyError as e:
            print(f'Clave faltante en el JSON: {str(e)}')
        except Exception as e:
            print(f'Error desconocido: {str(e)}')

    def handle_prueba(self, text_data_json):
        print('Mensaje de prueba recibido')
        message = 'Mensaje de prueba recibido'
        
        # Enviar el mensaje al grupo
        async_to_sync(self.channel_layer.group_send)(
            self.room_group_name,
            {
                'type': 'broadcast_prueba',  # Tipo de mensaje para la función que envía a todos
                'message': message,
            }
        )

    # Nueva función para enviar el mensaje a todos los miembros del grupo
    def broadcast_prueba(self, event):
        message = event['message']
        
        # Envía el mensaje al usuario que está conectado
        self.send(text_data=json.dumps({
            'type': 'prueba',
            'message': message,
        }))

    def handle_chat_message(self, text_data_json):
        message = text_data_json['message']
        sender_id = self.scope['user'].id

        # Guardar mensaje en la base de datos
        message_save = Message.objects.create(
            user_id=sender_id,
            room_id=self.id,
            message=message
        )
        message_save.save()

        # Enviar mensaje a la sala
        async_to_sync(self.channel_layer.group_send)(
            self.room_group_name,
            {
                'type': 'chat_message',
                'message': message,
                'username': self.user.username,
                'datetime': timezone.localtime(timezone.now()).strftime('%Y-%m-%d %H:%M:%S'),
                'sender_id': sender_id,
            }
        )

    def handle_draw(self, text_data_json):
        x = text_data_json['x']
        y = text_data_json['y']

        # Enviar datos del dibujo a la sala
        async_to_sync(self.channel_layer.group_send)(
            self.room_group_name,
            {
                'type': 'draw',
                'x': x,
                'y': y,
            }
        )

    def handle_user_list(self, text_data_json):
        # Esta función puede estar vacía si el manejo se realiza solo en el front-end
        pass

    def chat_message(self, event):
        message = event['message']
        username = event['username']
        datetime = event['datetime']
        sender_id = event['sender_id']
        
        current_user_id = self.scope['user'].id
        if sender_id != current_user_id:
            # Enviar mensaje de vuelta al WebSocket
            self.send(text_data=json.dumps({
                'type': 'chat_message',
                'message': message,
                'username': username,
                'datetime': datetime,
            }))
           
    def draw(self, event):
        # Enviar las coordenadas a los usuarios conectados
        self.send(text_data=json.dumps({
            'type': 'draw',
            'x': event['x'],
            'y': event['y'],
        }))
        
    
    # Añadir el handler para create_new_class
    def handle_create_new_class(self, text_data_json):
        classData = text_data_json['classData']

        # Enviar el mensaje a todos los sockets conectados
        async_to_sync(self.channel_layer.group_send)(
            self.room_group_name,
            {
                'type': 'create_new_class',
                'classData': classData,
            }
        )

    def create_new_class(self, event):
        classData = event['classData']

        # Enviar el mensaje a todos los sockets conectados
        self.send(text_data=json.dumps({
            'type': 'create_new_class',
            'classData': classData,
        }))
            
    def handle_add_property_to_class(self, text_data_json):
        classData = text_data_json['classData']

        # Enviar el mensaje a todos los sockets conectados
        async_to_sync(self.channel_layer.group_send)(
            self.room_group_name,
            {
                'type': 'add_property_to_class',
                'classData': classData,
            }
        )
    
    def add_property_to_class(self, event):
        classData = event['classData']

        # Enviar el mensaje a todos los sockets conectados
        self.send(text_data=json.dumps({
            'type': 'addPropertyToClass',
            'classData': classData,
        }))