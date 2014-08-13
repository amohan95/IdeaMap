var eventStack = [];
var graph = new Graph();
var selectedElement = null;
var width;
var height;

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
    .scaleExtent([.25, 10])
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
            var updatedSelection = d3.select(this).classed("selected", true);
            var node = graph.getNode(selectedElement[0][0]);
            if(node.getConnection(this) === null){
              var line = container.append("line")
                          .style("stroke", "black")
                          .attr("x1", selectedElement.attr("x"))
                          .attr("y1", selectedElement.attr("y"))
                          .attr("x2", updatedSelection.attr("x"))
                          .attr("y2", updatedSelection.attr("y"));
              node.addConnection(this, line);
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
    console.log(graph.getNode(selectedElement[0][0]));
  };

  var internalClickHandler = function() {
    if(d3.event.defaultPrevented) return;
    if(selectedElement !== null) {
      if(d3.event.toElement.id === "bounding-rect"){
         selectedElement.classed("selected", false);
         selectedElement = null;
         $("#selected-options").fadeOut();
      }
    }
    else {
      var location = d3.mouse(this);
      var x = location[0];
      var y = location[1];
      var element = container.append("g").call(drag).on("click", elementClickHandler)
        .attr("x", x).attr("y", y).attr("data-scale", 1)
        .attr("transform", "translate(" + x + "," + y + ") scale(1)");

      graph.addNode(new GraphNode(element[0][0], element));
      console.log(graph);

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
                                        .attr("viewbox", "0 -5 10 10")
                                        .attr("refX", 18)
                                        .attr("refY", 0)
                                        .attr("markerWidth", 6)
                                        .attr("markerHeight", 4)
                                        .attr("orient", "auto")
                                        .append("path")
                                            .attr("d", "M0,-5L10,0L0,5Z");

  var container = svg.append("g").attr("id", "main-container")
    .on("click", internalClickHandler);

  container.append("rect").attr("width", width).attr("height", height).attr("id", "bounding-rect");
}

function zoomed() {
  d3.select("#main-container").attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
}

var currentlyDragged;
function dragstarted(d) {
  d3.event.sourceEvent.stopPropagation();
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
      $("#selected-options").fadeOut();
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
    this.addConnection = function(other, connection) {
        this.connectedElements.push({"other" : other, "connection" : connection});
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

