
function init() {
  
  var $ = go.GraphObject.make;

  // Crear el menú contextual
  var nodeMenu =  // Un menú contextual genérico
    $(go.Adornment, "Vertical",
      $("ContextMenuButton",
        $(go.TextBlock, "Añadir Propiedad"),
        { click: function (e, obj) { addPropertyToClass(obj.part.adornedPart.data); } }
      ),
      $("ContextMenuButton",
        $(go.TextBlock, "Añadir Método"),
        { click: function (e, obj) { addMethodToClass(obj.part.adornedPart.data); } }
      )
    );

  // Función para añadir una propiedad a la clase
  function addPropertyToClass(classData) {
    var properties = classData.properties || [];
    properties.push({ name: "nuevaPropiedad" });  // Añadir una propiedad con un nombre genérico
    myDiagram.model.updateTargetBindings(classData);  // Actualizar el modelo de la clase
  }

  // Función para añadir un método a la clase
  function addMethodToClass(classData) {
    var methods = classData.methods || [];
    methods.push({ name: "nuevoMetodo" });  // Añadir un método con un nombre genérico
    myDiagram.model.updateTargetBindings(classData);  // Actualizar el modelo de la clase
  }

  //

  

  myDiagram =
        new go.Diagram('myDiagramDiv', {
          'undoManager.isEnabled': true,
          layout: new go.TreeLayout({
            // this only lays out in trees nodes connected by "generalization" links
            angle: 90,
            path: go.TreePath.Source,  // links go from child to parent
            setsPortSpot: false,  // keep Spot.AllSides for link connection spot
            setsChildPortSpot: false,  // keep Spot.AllSides
            // nodes not connected by "generalization" links are laid out horizontally
            arrangement: go.TreeArrangement.Horizontal
          })
        });

        
      
        // Añade la herramienta para ajustar la posición de los enlaces
      myDiagram.toolManager.mouseDownTools.add(new LinkShiftingTool());

      // show visibility or access as a single character at the beginning of each property or method
      function convertVisibility(v) {
        switch (v) {
          case 'public': return '+';
          case 'private': return '-';
          case 'protected': return '#';
          case 'package': return '~';
          default: return v;
        }
      }

      myDiagram.linkTemplate = 
      new go.Link({contextMenu: nodeMenu,
        reshapable: true, resegmentable: true, relinkableFrom: true, relinkableTo: true, adjusting: go.LinkAdjusting.Stretch,
      
      })
        .bindTwoWay('points')  // Vincula las coordenadas de los puntos del enlace
        .bindTwoWay('fromSpot', 'fromSpot', go.Spot.parse, go.Spot.stringify)  // Permite modificar la posición de los extremos del enlace
        .bindTwoWay('toSpot', 'toSpot', go.Spot.parse, go.Spot.stringify)  
        .add(new go.Shape(), new go.Shape({ toArrow: 'Standard' }));

      // the item template for properties
      var propertyTemplate = new go.Panel('Horizontal')
        .add(
          // property visibility/access
          new go.TextBlock({ isMultiline: false, editable: false, width: 12 })
            .bind('text', 'visibility', convertVisibility),
          // property name, underlined if scope=="class" to indicate static property
          new go.TextBlock({ isMultiline: false, editable: true })
            .bindTwoWay('text', 'name')
            .bind('isUnderline', 'scope', s => s[0] === 'c'),
          // property type, if known
          new go.TextBlock('')
            .bind('text', 'type', t => t ? ': ' : ''),
          new go.TextBlock({ isMultiline: false, editable: true })
            .bindTwoWay('text', 'type'),
          // property default value, if any
          new go.TextBlock({ isMultiline: false, editable: false })
            .bind('text', 'default', s => s ? ' = ' + s : '')
        );

      // the item template for methods
      var methodTemplate = new go.Panel('Horizontal')
        .add(
          // method visibility/access
          new go.TextBlock({ isMultiline: false, editable: false, width: 12 })
            .bind('text', 'visibility', convertVisibility),
          // method name, underlined if scope=="class" to indicate static method
          new go.TextBlock({ isMultiline: false, editable: true })
            .bindTwoWay('text', 'name')
            .bind('isUnderline', 'scope', s => s[0] === 'c'),
          // method parameters
          new go.TextBlock('()')
            // this does not permit adding/editing/removing of parameters via inplace edits
            .bind('text', 'parameters', parr => {
              var s = '(';
              for (var i = 0; i < parr.length; i++) {
                var param = parr[i];
                if (i > 0) s += ', ';
                s += param.name + ': ' + param.type;
              }
              return s + ')';
            }),
          // method return type, if any
          new go.TextBlock('')
            .bind('text', 'type', t => t ? ': ' : ''),
          new go.TextBlock({ isMultiline: false, editable: true })
            .bindTwoWay('text', 'type')
        );

      // this simple template does not have any buttons to permit adding or
      // removing properties or methods, but it could!

      myDiagram.nodeTemplate =
        new go.Node('Auto', 
          {
          contextMenu: nodeMenu, // Asignar el menú contextual a los nodos
          locationSpot: go.Spot.Center,
          fromSpot: go.Spot.AllSides,
          toSpot: go.Spot.AllSides
        })
          .add(
            new go.Shape({ fill: 'lightyellow', portId: '', cursor: 'pointer', fromSpot: go.Spot.AllSides, toSpot: go.Spot.AllSides, fromLinkable: true, toLinkable: true }),
            new go.Panel('Table', { defaultRowSeparatorStroke: 'black' })
              .add(
                // header
                new go.TextBlock({
                  row: 0, columnSpan: 2, margin: 3, alignment: go.Spot.Center,
                  font: 'bold 12pt sans-serif',
                  isMultiline: false, editable: true
                })
                  .bindTwoWay('text', 'name'),
                // properties
                new go.TextBlock('Properties', { row: 1, font: 'italic 10pt sans-serif' })
                  .bindObject('visible', 'visible', v => !v, undefined, 'PROPERTIES'),
                new go.Panel('Vertical', {
                  name: 'PROPERTIES',
                  row: 1,
                  margin: 3,
                  stretch: go.Stretch.Horizontal,
                  defaultAlignment: go.Spot.Left,
                  background: 'lightyellow',
                  itemTemplate: propertyTemplate
                })
                  .bind('itemArray', 'properties'),
                go.GraphObject.build("PanelExpanderButton", {
                  row: 1,
                  column: 1,
                  alignment: go.Spot.TopRight,
                  visible: false
                }, "PROPERTIES")
                  .bind('visible', 'properties', arr => arr.length > 0),
                // methods
                new go.TextBlock('Methods', { row: 2, font: 'italic 10pt sans-serif' })
                  .bindObject('visible', 'visible', v => !v, undefined, 'METHODS'),
                new go.Panel('Vertical', {
                  name: 'METHODS',
                  row: 2,
                  margin: 3,
                  stretch: go.Stretch.Horizontal,
                  defaultAlignment: go.Spot.Left,
                  background: 'lightyellow',
                  itemTemplate: methodTemplate
                })
                  .bind('itemArray', 'methods'),
                go.GraphObject.build("PanelExpanderButton", {
                  row: 2,
                  column: 1,
                  alignment: go.Spot.TopRight,
                  visible: false
                }, "METHODS")
                  .bind('visible', 'methods', arr => arr.length > 0)
              )
          );

      function linkStyle() {
        return { isTreeLink: false, fromEndSegmentLength: 0, toEndSegmentLength: 0 };
      }

      myDiagram.linkTemplate = new go.Link({ // by default, "Inheritance" or "Generalization"
          ...linkStyle(),
          isTreeLink: true
        })
        .add(
          new go.Shape(),
          new go.Shape({ toArrow: 'Triangle', fill: 'white' })
        );

      myDiagram.linkTemplateMap.add('Association',
        new go.Link(linkStyle())
          .add(
            new go.Shape()
          ));

      myDiagram.linkTemplateMap.add('Realization',
        new go.Link(linkStyle())
          .add(
            new go.Shape({ strokeDashArray: [3, 2] }),
            new go.Shape({ toArrow: 'Triangle', fill: 'white' })
          ));

      myDiagram.linkTemplateMap.add('Dependency',
        new go.Link(linkStyle())
          .add(
            new go.Shape({ strokeDashArray: [3, 2] }),
            new go.Shape({ toArrow: 'OpenTriangle' })
          ));

      myDiagram.linkTemplateMap.add('Composition',
        new go.Link(linkStyle())
          .add(
            new go.Shape(),
            new go.Shape({ fromArrow: 'StretchedDiamond', scale: 1.3 }),
            new go.Shape({ toArrow: 'OpenTriangle' })
          ));

      myDiagram.linkTemplateMap.add('Aggregation',
        new go.Link(linkStyle())
          .add(
            new go.Shape(),
            new go.Shape({ fromArrow: 'StretchedDiamond', fill: 'white', scale: 1.3 }),
            new go.Shape({ toArrow: 'OpenTriangle' })
          ));

      // setup a few example class nodes and relationships
      var nodedata = [
        {
          key: 1,
          name: 'BankAccount',
          properties: [
            { name: 'owner', type: 'String', visibility: 'public' },
            { name: 'balance', type: 'Currency', visibility: 'public', default: '0' }
          ],
          methods: [
            { name: 'deposit', parameters: [{ name: 'amount', type: 'Currency' }], visibility: 'public' },
            { name: 'withdraw', parameters: [{ name: 'amount', type: 'Currency' }], visibility: 'public' }
          ]
        },
        {
          key: 11,
          name: 'Person',
          properties: [
            { name: 'name', type: 'String', visibility: 'public' },
            { name: 'birth', type: 'Date', visibility: 'protected' }
          ],
          methods: [
            { name: 'getCurrentAge', type: 'int', visibility: 'public' }
          ]
        },
        {
          key: 12,
          name: 'Student',
          properties: [
            { name: 'classes', type: 'List<Course>', visibility: 'public' }
          ],
          methods: [
            { name: 'attend', parameters: [{ name: 'class', type: 'Course' }], visibility: 'private' },
            { name: 'sleep', visibility: 'private' }
          ]
        },
        {
          key: 13,
          name: 'Professor',
          properties: [
            { name: 'classes', type: 'List<Course>', visibility: 'public' }
          ],
          methods: [
            { name: 'teach', parameters: [{ name: 'class', type: 'Course' }], visibility: 'private' }
          ]
        },
        {
          key: 14,
          name: 'Course',
          properties: [
            { name: 'name', type: 'String', visibility: 'public' },
            { name: 'description', type: 'String', visibility: 'public' },
            { name: 'professor', type: 'Professor', visibility: 'public' },
            { name: 'location', type: 'String', visibility: 'public' },
            { name: 'times', type: 'List<Time>', visibility: 'public' },
            { name: 'prerequisites', type: 'List<Course>', visibility: 'public' },
            { name: 'students', type: 'List<Student>', visibility: 'public' }
          ],
          //should figure out a better way to fix this sometime
          methods: []
        }
      ];
      
      var linkdata = [
        { from: 12, to: 11, relationship: 'Realization' },
        { from: 13, to: 11, relationship: 'Aggregation'},
        { from: 14, to: 13, relationship: 'Association' }
      ];
      
      myDiagram.model = new go.GraphLinksModel(
        {
          copiesArrays: true,
          copiesArrayObjects: true,
          linkCategoryProperty: 'relationship',
          nodeDataArray: nodedata,
          linkDataArray: linkdata
        });
      
    


    // Listener para seleccionar el primer enlace cuando se completa el diseño inicial
    myDiagram.addDiagramListener('InitialLayoutCompleted', (e) => {
      myDiagram.links.first().isSelected = true;
    });

    // Función para crear una nueva clase
    function createNewClass() {
      const className = prompt("Enter the name of the new class:");
      if (!className) return;  // Si el usuario cancela o no introduce un nombre, no hacer nada

      // Crear la nueva clase en el diagrama
      const newClassData = {
          key: myDiagram.model.nodeDataArray.length + 1,
          name: className,
          properties: [],
          methods: []
      };

      // Agregar la nueva clase al modelo de GoJS
      myDiagram.model.addNodeData(newClassData);

      // Enviar la nueva clase al servidor mediante WebSocket
      chatSocket.send(JSON.stringify({
          type: 'create_new_class',
          classData: newClassData,
          
      }));
      console.log('send create new class');    
    }

    // Función para exportar (puedes modificar el formato según lo que necesites)
    function exportDiagram() {
      var blob = new Blob([myDiagram.model.toJson()], { type: 'application/json' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = 'diagrama.json';
      a.click();
    }

    

    // Crear el menú contextual
    var nodeMenu =  // Un menú contextual genérico
    $(go.Adornment, "Vertical",
      $("ContextMenuButton",
        $(go.TextBlock, "Añadir Propiedad"),
        { click: function(e, obj) { addPropertyToClass(obj.part.adornedPart.data); } }
      ),
      $("ContextMenuButton",
        $(go.TextBlock, "Añadir Método"),
        { click: function(e, obj) { addMethodToClass(obj.part.adornedPart.data); } }
      )
    );
    
     
  window.addEventListener('DOMContentLoaded', init);
  }