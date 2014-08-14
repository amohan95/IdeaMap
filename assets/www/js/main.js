var eventStack = [];
var graph = new Graph();
var selectedElement = null;
var width;
var height;
var elementIdCounter = 0;

$('#page-home').live('pageinit', function(event) {
  var availWidth = screen.availWidth;
  var availHeight = screen.availHeight - $("#header").height() - $("#footer").height();

  width = availWidth * 3;
  height = availHeight * 3;
  
  var mainContent = $("#main-content");
  mainContent.css("width", "100%");
  mainContent.css("height", availHeight + "px");
  initSVG(width, height);
  initButtonHandlers();
});

function initSVG(width, height) {
  var zoom = d3.behavior.zoom()
    .scaleExtent([.15, 10])
    .on("zoom", zoomed);

  var drag = d3.behavior.drag()
    .origin(function() {
      var el = d3.select(this);
      return {"x" : el.attr("x"), "y" : el.attr("y")};
    })
    .on("dragstart", dragstarted)
    .on("drag", dragged)
    .on("dragend", dragended);

  var elementClickHandler = function() {
    if(d3.event.defaultPrevented) return;
    if(selectedElement !== null) {
        if(selectedElement[0][0] !== this){
            selectedElement.classed("selected", false);
            var prevNode = graph.getNode(selectedElement[0][0]);
            var updatedNode = graph.getNode(this);
            var updatedSelection = d3.select(this).classed("selected", true);
            if(prevNode.getConnection(this) === null){
              var line = container.insert("line", "#bounding-rect")
                          .style("stroke", "black")
                          .attr("x1", selectedElement.attr("x"))
                          .attr("y1", selectedElement.attr("y"))
                          .attr("x2", updatedSelection.attr("x"))
                          .attr("y2", updatedSelection.attr("y"))
                          .attr("marker-end", "url(#arrowhead)");
              prevNode.addConnection(this, line, false);
              updatedNode.addConnection(selectedElement[0][0], line, true);
            }
            selectedElement = updatedSelection;
        }
    }
    else {
        $("#selected-options").css({
          display: 'inline-block',
            opacity:0
        }).animate({
            opacity: 1
        });
        selectedElement = d3.select(this);
        selectedElement.classed("selected", true);
    }
  };

  var internalClickHandler = function() {
    if(d3.event.defaultPrevented) return;
    if(selectedElement !== null) {
      if(d3.event.toElement.id === "bounding-rect"){
         selectedElement.classed("selected", false);
         selectedElement = null;
         $("#selected-options").fadeOut("fast");
      }
    }
    else {
      var location = d3.mouse(this);
      var x = location[0];
      var y = location[1];
      var element = container.append("g").call(drag).on("click", elementClickHandler)
        .attr("x", x).attr("y", y).attr("data-scale", 3)
        .attr("transform", "translate(" + x + "," + y + ") scale(3)")
        .attr("id", "el-" + elementIdCounter++)
        .classed("node", true);

      graph.addNode(new GraphNode(element[0][0]));
      element
        .append("circle")
        .attr("r", 10).attr("stroke", "black").attr("stroke-width", 1)
        .attr("fill", "green");
    }
 };

  var svg = d3.select("#main-content").append("svg")
    .attr("id", "main-svg")
    .style("width", width)
    .style("height", height)
    .append("g").attr("transform", "translate(0, 0)").call(zoom);

  d3.select("#main-svg").append("defs").append("marker")
                                        .attr("id", "arrowhead")
                                        .attr("refX", 4)
                                        .attr("refY", 4)
                                        .attr("markerWidth", 12)
                                        .attr("markerHeight", 8)
                                        .attr("orient", "auto")
                                        .append("path")
                                            .attr("d", "M 0,0 V 8 L12,4 Z");

  var container = svg.append("g").attr("id", "main-container")
    .on("click", internalClickHandler);

  container.append("rect").attr("width", width).attr("height", height).attr("id", "bounding-rect");
}

function zoomed() {
  d3.select("#main-container").attr("transform", "translate(" + d3.event.translate + ") scale(" + d3.event.scale + ")");
}

var currentlyDragged;
var connections;
function dragstarted(d) {
  d3.event.sourceEvent.stopPropagation();
  currentlyDragged = graph.getNode(this);
  connections = currentlyDragged.connectedElements;
  d3.select(this).classed("dragging", true);
}

function dragged() {
  var el = d3.select(this);
  var x = d3.event.x < 0 ? 0 : (d3.event.x > width ? width : d3.event.x);
  var y = d3.event.y < 0 ? 0 : (d3.event.y > height ? height : d3.event.y);
  el.attr("x", x);
  el.attr("y", y);
  var scale = el.attr("data-scale");
  el.attr("transform", "translate(" + x + "," + y + ") scale(" + scale + ")");
  for(var i = 0; i < connections.length; i++) {
    var connection = connections[i].connection;
    if(connections[i].isOrigin) {
      connection.attr("x2", x);
      connection.attr("y2", y);
    }
    else {
      connection.attr("x1", x);
      connection.attr("y1", y);
    }
  }
}

function dragended(d) {
  d3.event.sourceEvent.stopPropagation();
  d3.select(this).classed("dragging", false);
}

function initButtonHandlers() {
  $(".scale-change").click(function(){
    if(selectedElement !== null) {
      var scale = parseInt(selectedElement.attr("data-scale"));
      if(this.id === "decrease-size") scale = Math.max(scale - 1, 1);
      else scale++;
      selectedElement.attr("data-scale", scale);
      selectedElement.attr("transform", selectedElement.attr("transform").split(" ")[0] + " scale(" + scale + ")");
    }
  });

  $("#remove-element").click(function(){
    if(selectedElement !== null) {
      selectedElement.remove();
      selectedElement = null;
      $("#selected-options").fadeOut("fast");
    }
  });
}

function Graph() {
    this.nodes = [];
    this.addNode = function(node) {
        this.nodes.push(node);
    }
    this.removeNode = function(element) {
        for(var i = this.nodes.length; i >= 0; i--) {
            if(this.nodes[i].element === element) return this.nodes.splice(i, 1);
        }
    }
    this.getNode = function(element) {
        for(var i = 0; i < this.nodes.length; i++) {
            if(this.nodes[i].element === element) return this.nodes[i];
        }
    }
}

function GraphNode(element){
    this.connectedElements = [];
    this.element = element;
    this.addConnection = function(other, connection, isOrigin) { // origin -> if x1y1 or x2y2
        this.connectedElements.push({"other" : other, "connection" : connection, "isOrigin" : isOrigin});
    }
    this.removeConnection = function(other) {
        for(var i = this.connectedElements.length - 1; i >= 0; i--) {
            if(this.connectedElements[i].other === other) return this.connectedElements.splice(i, 1);
        }
    }
    this.getConnection = function(other) {
        for(var i = 0; i < this.connectedElements.length; i++) {
            if(this.connectedElements[i].other === other) return this.connectedElements[i];
        }
        return null;
    }
}

