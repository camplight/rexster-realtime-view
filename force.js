(function(){

  var getNode = function(vertexId, nodes) {
    for(var i = 0; i<nodes.length; i++)
      if(nodes[i].id == vertexId)
        return nodes[i];
    return undefined;
  }

  app.createD3GraphData = function(vertexes, edges) {
    var data = {
      nodes: [],
      links: []
    }
    for(var i = 0; i<vertexes.length; i++) {
      data.nodes.push({
        id: vertexes[i]._id,
        name: vertexes[i]._id
      });
    }
    for(var i = 0; i<edges.length; i++) {
      data.links.push({
        source: getNode(edges[i]._inV, data.nodes),
        target: getNode(edges[i]._outV, data.nodes)
      });
    }
    return data;
  }

  app.createGraphView = function(graph, vertexes, edges){
    
    var width = window.innerWidth,
        height = window.innerHeight;

    var color = d3.scale.category20();

    var force = d3.layout.force()
        .charge(-120)
        .linkDistance(15)
        .size([width, height]);

    var svg = d3.select("#chart").append("svg")
        .attr("width", width)
        .attr("height", height);

    var json = app.createD3GraphData(vertexes, edges);
    force
        .nodes(json.nodes)
        .links(json.links);

    var restart = function(){
      force.start();

      var link = svg.selectAll("line.link")
        .data(json.links)
        .enter().append("line")
          .attr("class", "link")
          .style("stroke-width", function(d) { return Math.sqrt(1); });

      var node = svg.selectAll("circle.node")
          .data(json.nodes)
        .enter().append("circle")
          .attr("class", "node")
          .attr("r", 6)
          .style("fill", function(d) { return color(5); })
          .on("mouseover", function(d){
            d3.select(this)
              .attr("r", 15);
          })
          .on("mouseout", function(d){
            d3.select(this)
              .transition()
              .duration(2000)
              .attr("r", 6);
          })
          .call(force.drag);

      node.append("title")
          .text(function(d) { return "NODE"+d.name; });
    }

    restart();

    force.on("tick", function() {
      svg.selectAll("line.link")
          .attr("x1", function(d) { return d.source.x; })
          .attr("y1", function(d) { return d.source.y; })
          .attr("x2", function(d) { return d.target.x; })
          .attr("y2", function(d) { return d.target.y; });

      svg.selectAll("circle.node")
          .attr("cx", function(d) { return d.x; })
          .attr("cy", function(d) { return d.y; });
    });

    var API = {
      clear: function(){
        json.nodes = [];
        json.edges = [];
        vertexes = [];
        edges = [];
        
        force
          .nodes(json.nodes)
          .links(json.links);

        restart();
      },
      addNewVertex: function(vertex, point){
        console.log("ADDING VERTEX",vertex);
        vertexes.push(vertex);

        var newNode = {
          id: vertex._id,
          name: vertex._id
        };
        if(point) {
          newNode.x = point[0];
          newNode.y = point[1];
        }

        json.nodes.push(newNode);
        
        restart();
        return newNode;
      },
      addNewEdge: function(edge){
        console.log("ADDING EDGE", edge);
        
        edges.push(edge);

        json.links.push({
          source: getNode(edge._inV, json.nodes),
          target: getNode(edge._outV, json.nodes)
        });

        restart();
      }
    }



    var cursor = svg.append("svg:circle")
      .attr("r", 45)
      .attr("transform", "translate(-100,-100)")
      .attr("class", "cursor");

    svg.on("mousemove", function() {
      cursor.attr("transform", "translate(" + d3.svg.mouse(this) + ")");
    });

    svg.on("mousedown", function() {
      
      var point = d3.svg.mouse(this);
      
      if(KeyboardJS.activeKeys()[0] != "ctrl") {
        graph.addVertex({}, function(err, vertex){
          var node = API.addNewVertex(vertex, point);

          // add links to any nearby nodes
          json.nodes.forEach(function(target) {
            var x = target.x - point[0],
                y = target.y - point[1];
            if (Math.sqrt(x * x + y * y) < 45) {
              graph.addEdge(target.id, node.id, "none", {}, function(err, newEdge){
                API.addNewEdge(newEdge);      
              });
            }
          });
        });
      }
    });


    return API;
  }
})();
