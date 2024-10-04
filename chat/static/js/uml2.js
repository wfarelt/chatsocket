// DiagramaUML

var $ = go.GraphObject.make;

myDiagram = new go.Diagram("myDiagramDiv", {
  "undoManager.isEnabled": true,
  layout: new go.TreeLayout({
    // this only lays out in trees nodes connected by "generalization" links
    angle: 90,
    path: go.TreePath.Source, // links go from child to parent
    setsPortSpot: false, // keep Spot.AllSides for link connection spot
    setsChildPortSpot: false, // keep Spot.AllSides
    // nodes not connected by "generalization" links are laid out horizontally
    arrangement: go.TreeArrangement.Horizontal,
  }),
});

// Añade la herramienta para ajustar la posición de los enlaces
myDiagram.toolManager.mouseDownTools.add(new LinkShiftingTool());

// show visibility or access as a single character at the beginning of each property or method
function convertVisibility(v) {
  switch (v) {
    case "public":
      return "+";
    case "private":
      return "-";
    case "protected":
      return "#";
    case "package":
      return "~";
    default:
      return v;
  }
}

// Crear el menú contextual
var nodeMenu = $(go.Adornment, "Vertical",
    $("ContextMenuButton", $(go.TextBlock, "Añadir Propiedad"), {
      click: function (e, obj) {
        console.log("Añadiendo propiedad...");
        addPropertyToClass(obj.part.adornedPart.data);
      }
    }),
    $("ContextMenuButton", $(go.TextBlock, "Añadir Método"), {
      click: function (e, obj) {
        console.log("Añadiendo método...");
        addMethodToClass(obj.part.adornedPart.data);
      }
    })
  );

// Función para añadir una propiedad a la clase
function addPropertyToClass(classData) {
  var properties = classData.properties || [];
  properties.push({ name: "nuevaPropiedad" }); // Añadir una propiedad con un nombre genérico
  myDiagram.model.updateTargetBindings(classData); // Actualizar el modelo de la clase
  chatSocket.send(JSON.stringify({ type: "addPropertyToClass", classData: classData }));
}

// Función para añadir un método a la clase
function addMethodToClass(classData) {
  var methods = classData.methods || [];
  methods.push({ name: "nuevoMetodo" }); // Añadir un método con un nombre genérico
  myDiagram.model.updateTargetBindings(classData); // Actualizar el modelo de la clase
}

myDiagram.linkTemplate = new go.Link({
  contextMenu: nodeMenu,
  reshapable: true,
  resegmentable: true,
  relinkableFrom: true,
  relinkableTo: true,
  adjusting: go.LinkAdjusting.Stretch,
})
  .bindTwoWay("points") // Vincula las coordenadas de los puntos del enlace
  .bindTwoWay("fromSpot", "fromSpot", go.Spot.parse, go.Spot.stringify) // Permite modificar la posición de los extremos del enlace
  .bindTwoWay("toSpot", "toSpot", go.Spot.parse, go.Spot.stringify)
  .add(new go.Shape(), new go.Shape({ toArrow: "Standard" }));

// the item template for properties
var propertyTemplate = new go.Panel("Horizontal").add(
  // property visibility/access
  new go.TextBlock({ isMultiline: false, editable: false, width: 12 }).bind(
    "text",
    "visibility",
    "convertVisibility"
  ),
  // property name, underlined if scope=="class" to indicate static property
  new go.TextBlock({ isMultiline: false, editable: true })
    .bindTwoWay("text", "name")
    .bind("isUnderline", "scope", (s) => s[0] === "c"),
  // property type, if known
  new go.TextBlock("").bind("text", "type", (t) => (t ? ": " : "")),
  new go.TextBlock({ isMultiline: false, editable: true }).bindTwoWay(
    "text",
    "type"
  ),
  // property default value, if any
  new go.TextBlock({ isMultiline: false, editable: false }).bind(
    "text",
    "default",
    (s) => (s ? " = " + s : "")
  )
);

// the item template for methods
var methodTemplate = new go.Panel("Horizontal").add(
  // method visibility/access
  new go.TextBlock({ isMultiline: false, editable: false, width: 12 }).bind(
    "text",
    "visibility",
    "convertVisibility"
  ),
  // method name, underlined if scope=="class" to indicate static method
  new go.TextBlock({ isMultiline: false, editable: true })
    .bindTwoWay("text", "name")
    .bind("isUnderline", "scope", (s) => s[0] === "c"),
  // method parameters
  new go.TextBlock("()")
    // this does not permit adding/editing/removing of parameters via inplace edits
    .bind("text", "parameters", (parr) => {
      var s = "(";
      for (var i = 0; i < parr.length; i++) {
        var param = parr[i];
        if (i > 0) s += ", ";
        s += param.name + ": " + param.type;
      }
      return s + ")";
    }),
  // method return type, if any
  new go.TextBlock("").bind("text", "type", (t) => (t ? ": " : "")),
  new go.TextBlock({ isMultiline: false, editable: true }).bindTwoWay(
    "text",
    "type"
  )
);

myDiagram.nodeTemplate = new go.Node("Auto", {
  contextMenu: nodeMenu, // Asignar el menú contextual a los nodos
  locationSpot: go.Spot.Center,
  fromSpot: go.Spot.AllSides,
  toSpot: go.Spot.AllSides,
}).add(
  new go.Shape({
    fill: "lightyellow",
    portId: "",
    cursor: "pointer",
    fromSpot: go.Spot.AllSides,
    toSpot: go.Spot.AllSides,
    fromLinkable: true,
    toLinkable: true,
  }),
  new go.Panel("Table", { defaultRowSeparatorStroke: "black" }).add(
    // header
    new go.TextBlock({
      row: 0,
      columnSpan: 2,
      margin: 3,
      alignment: go.Spot.Center,
      font: "bold 12pt sans-serif",
      isMultiline: false,
      editable: true,
    }).bindTwoWay("text", "name"),
    // properties
    new go.TextBlock("Properties", {
      row: 1,
      font: "italic 10pt sans-serif",
    }).bindObject("visible", "visible", (v) => !v, undefined, "PROPERTIES"),
    new go.Panel("Vertical", {
      name: "PROPERTIES",
      row: 1,
      margin: 3,
      stretch: go.Stretch.Horizontal,
      defaultAlignment: go.Spot.Left,
      background: "lightyellow",
      itemTemplate: propertyTemplate,
    }).bind("itemArray", "properties"),
    go.GraphObject.build(
      "PanelExpanderButton",
      {
        row: 1,
        column: 1,
        alignment: go.Spot.TopRight,
        visible: false,
      },
      "PROPERTIES"
    ).bind("visible", "properties", (arr) => arr.length > 0),
    // methods
    new go.TextBlock("Methods", {
      row: 2,
      font: "italic 10pt sans-serif",
    }).bindObject("visible", "visible", (v) => !v, undefined, "METHODS"),
    new go.Panel("Vertical", {
      name: "METHODS",
      row: 2,
      margin: 3,
      stretch: go.Stretch.Horizontal,
      defaultAlignment: go.Spot.Left,
      background: "lightyellow",
      itemTemplate: methodTemplate,
    }).bind("itemArray", "methods"),
    go.GraphObject.build(
      "PanelExpanderButton",
      {
        row: 2,
        column: 1,
        alignment: go.Spot.TopRight,
        visible: false,
      },
      "METHODS"
    ).bind("visible", "methods", (arr) => arr.length > 0)
  )
);

function linkStyle() {
  return {
    isTreeLink: false,
    fromEndSegmentLength: 0,
    toEndSegmentLength: 0,
  };
}

myDiagram.linkTemplate = new go.Link({
  // by default, "Inheritance" or "Generalization"
  ...linkStyle(),
  isTreeLink: true,
}).add(new go.Shape(), new go.Shape({ toArrow: "Triangle", fill: "white" }));

myDiagram.linkTemplateMap.add(
  "Association",
  new go.Link(linkStyle()).add(new go.Shape())
);

myDiagram.linkTemplateMap.add(
  "Realization",
  new go.Link(linkStyle()).add(
    new go.Shape({ strokeDashArray: [3, 2] }),
    new go.Shape({ toArrow: "Triangle", fill: "white" })
  )
);

myDiagram.linkTemplateMap.add(
  "Dependency",
  new go.Link(linkStyle()).add(
    new go.Shape({ strokeDashArray: [3, 2] }),
    new go.Shape({ toArrow: "OpenTriangle" })
  )
);

myDiagram.linkTemplateMap.add(
  "Composition",
  new go.Link(linkStyle()).add(
    new go.Shape(),
    new go.Shape({ fromArrow: "StretchedDiamond", scale: 1.3 }),
    new go.Shape({ toArrow: "OpenTriangle" })
  )
);

myDiagram.linkTemplateMap.add(
  "Aggregation",
  new go.Link(linkStyle()).add(
    new go.Shape(),
    new go.Shape({
      fromArrow: "StretchedDiamond",
      fill: "white",
      scale: 1.3,
    }),
    new go.Shape({ toArrow: "OpenTriangle" })
  )
);

var nodedata = []; // Array de nodos

var linkdata = []; // Array de enlaces

myDiagram.model = new go.GraphLinksModel({
  copiesArrays: true,
  copiesArrayObjects: true,
  linkCategoryProperty: "relationship",
  nodeDataArray: nodedata,
  linkDataArray: linkdata,
});

// Listener para seleccionar el primer enlace cuando se completa el diseño inicial
//myDiagram.addDiagramListener("InitialLayoutCompleted", (e) => {
//  myDiagram.links.first().isSelected = true;
//});

// Función para crear una nueva clase que pueda llamarse desde el boton html
window.createNewClass = function () {
    const className = prompt("Enter the name of the new class:");
    if (!className) return; // Si el usuario cancela o no introduce un nombre, no hacer nada
  
    // Crear la nueva clase en el diagrama
    const newClassData = {
      key: myDiagram.model.nodeDataArray.length + 1,
      name: className,
      properties: [],
      methods: [],
    };
  
    // Agregar la nueva clase al modelo de GoJS
    //myDiagram.model.addNodeData(newClassData);
  
    // Enviar la nueva clase al servidor mediante WebSocket
    chatSocket.send(JSON.stringify({ type: "create_new_class", classData: newClassData }));
  
    console.log("send create new class: " + JSON.stringify(newClassData));
  };

// Función para exportar (puedes modificar el formato según lo que necesites)
function exportDiagram() {
  var blob = new Blob([myDiagram.model.toJson()], { type: "application/json" });
  var url = URL.createObjectURL(blob);
  var a = document.createElement("a");
  a.href = url;
  a.download = "diagrama.json";
  a.click();
}

// Función para enviar un mensaje al servidor
window.prueba = function () {
    chatSocket.send(JSON.stringify({ type: "prueba" }));
    console.log("send prueba")  
};
