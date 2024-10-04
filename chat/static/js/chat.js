$(function () {
  console.log(user, room_id);

  var protocol = window.location.protocol === "https:" ? "wss://" : "ws://";
  var url = protocol + window.location.host + "/ws/room/" + room_id + "/";

  console.log(url);

  window.chatSocket = new WebSocket(url);

  chatSocket.onopen = function (e) {
    console.log("WEBSOCKET ABIERTO");
  };

  chatSocket.onclose = function (e) {
    console.log("WEBSOCKET CERRADO");
  };

  chatSocket.onmessage = function (e) {
  
    const data = JSON.parse(e.data);
    // Imprimir mensaje recibido en la consola
    console.log("Mensaje recibido del servidor:", data); 

    if (data.type === "addPropertyToClass") {
      const classData = data.classData;
      console.log("Propiedad agregada a todos");
      // Agregar la nueva propiedad a la clase en el diagrama
      var properties = classData.properties || [];
      properties.push({ name: "nuevaPropiedad" }); // Añadir una propiedad con un nombre genérico
      myDiagram.model.updateTargetBindings(classData);
    }


    if (data.type === "prueba") {
      const mensaje = data.message;
      console.log(mensaje);
    }
    
    if (data.type === "create_new_class") {
      const classData = data.classData;
      console.log("Nueva clase creada para todos");
      // Agregar la nueva clase al diagrama
      myDiagram.model.addNodeData(classData); 
    }

    if (data.type === "draw") {
      ctx.lineTo(data.x, data.y);
      ctx.stroke();
    }

    if (data.type === "chat_message") {
      var msj = data.message;
      var username = data.username;
      var datetime = data.datetime;

      document.querySelector("#boxMessages").innerHTML += `
            <div class="alert alert-success" role="alert">
                ${msj}
                <div>
                    <small class="fst-italic fw-bold">${username}</small>
                    <small class="float-end">${datetime}</small>
                </div>
            </div>
            `;
    } else if (data.type === "user_list") {
      let userListHtml = "";

      for (const username of data.users) {
        const userClass = username == user ? "list-group-item-success" : "";
        userListHtml += `<li class="list-group-item ${userClass}">@${username}</li>`;
      }

      document.querySelector("#usersList").innerHTML = userListHtml;
    }
  };

  chatSocket.onerror = function (e) {
    console.error("WebSocket error: ", e);
  };

  document.querySelector("#btnMessage").addEventListener("click", SendMessage);

  document
    .querySelector("#inputMessage")
    .addEventListener("keypress", function (e) {
      if (e.keyCode == 13) {
        SendMessage();
      }
    });

  function SendMessage() {
    var message = document.querySelector("#inputMessage");

    if (message.value.trim() !== "") {
      // Mostrar el mensaje en el chat
      loadMessageHTML(message.value.trim());

      if (chatSocket.readyState === WebSocket.OPEN) {
        // Enviar mensaje al WebSocket
        chatSocket.send(
          JSON.stringify({
            type: "chat_message",
            message: message.value.trim(),
          })
        );
        console.log(message.value.trim());
      } else {
        console.log(
          "WebSocket no está abierto. No se puede enviar el mensaje."
        );
      }

      message.value = "";
    } else {
      console.log("No se ha enviado un mensaje");
    }
  }

  function loadMessageHTML(m) {
    let today = new Date();
    let date = today.toLocaleDateString();
    let time = today.toLocaleTimeString();

    document.querySelector("#boxMessages").insertAdjacentHTML(
      "beforeend",
      `
        <div class="alert alert-primary" role="alert">
            ${m}
            <div>
                <small class="fst-italic fw-bold">${user}</small>
                <small class="float-end">${date} ${time}</small>
            </div>
        </div>
        `
    );
  }

  window.onbeforeunload = function () {
    chatSocket.close(1000, "User disconnected");
  };

  

  

});
