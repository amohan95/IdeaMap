/***
* Globals
***/

var eventStack = [];
var graph = new Graph();
var selectedElement = null;
var elementIdCounter = 0;
var graphName;
var width;
var height;

/***
* End Globals
***/

/***
* Node/Link Storage
***/

function storeLocalChanges() {
  var storageObject = new Object();
  storageObject.elementIdCounter = elementIdCounter;
  storageObject.graph = JSON.stringify(graph, function(key, value){
    if(key === "connection") {
      return value[0][0].outerHTML;
    }
    else {
      return value;
    }
  });
  storageObject.svg = $("#main-container").html();
  window.localStorage[graphName] = JSON.stringify(storageObject);
}

function initFromStorage() {
  selectedElement = null;
  var storageObject = JSON.parse(window.localStorage[graphName]);
  var tmpGraph = JSON.parse(storageObject.graph);
  graph = new Graph();
  for(var i = 0; i < tmpGraph.nodes.length; i++) {
    var tmpNode = tmpGraph.nodes[i];
    var node = new GraphNode(tmpNode.elementId);
    var connections = tmpNode.connectedElements;
    for(var key in connections){
      var link = connections[key];
      node.addConnection(key, link.connection, link.isOrigin);
    }
    graph.addNode(node);
  }
  elementIdCounter = storageObject.elementIdCounter;
  var mainContainer = $("#main-container");
  mainContainer.empty();
  var jQuerySvg = $(storageObject.svg);
  mainContainer.append(jQuerySvg);
  mainContainer.html(mainContainer.html());
  $("#main-container line").each(function(k, v){
    v.remove();
  });
  d3.selectAll(".node").call(drag).on("click", elementClickHandler);

  var nodes = graph.nodes;
  for (var i = nodes.length - 1; i >= 0; i--) {
    var node = nodes[i];
    var conn = node.connectedElements;
    for(var key in conn) {
      var link = conn[key];
      if(!link.isOrigin) {
        var jQueryConn = $(link.connection);
        var x1 = jQueryConn.attr("x1");
        var y1 = jQueryConn.attr("y1");
        var x2 = jQueryConn.attr("x2");
        var y2 = jQueryConn.attr("y2");
        node.removeConnection(key);
        var otherNode = graph.getNode(key);
        otherNode.removeConnection(node.elementId);
        addConnection(node, otherNode, d3.select("#" + nodes[i].elementId), d3.select("#" + key));
      }
    }
  }
  d3.selectAll(".selected").classed("selected", false);
}

function Graph() {
  this.nodes = [];
  this.addNode = function(node) {
    this.nodes.push(node);
  }
  this.removeNode = function(elementId) {
    for(var i = this.nodes.length; i >= 0; i--) {
      if(this.nodes[i].elementId === elementId) return this.nodes.splice(i, 1);
    }
  }
  this.getNode = function(elementId) {
    for(var i = 0; i < this.nodes.length; i++) {
      if(this.nodes[i].elementId === elementId) return this.nodes[i];
    }
  }
}

function GraphNode(elementId){
  this.connectedElements = new Object();
  this.elementId = elementId;
  this.addConnection = function(otherId, connection, isOrigin) { // origin -> if x1y1 or x2y2
    this.connectedElements[otherId] = {"connection" : connection, "isOrigin" : isOrigin};
  }

  this.removeConnection = function(otherId) {
    var link = this.connectedElements[otherId];
    if(typeof link.connection !== "string" && link.connection !== null) {
      link.connection.remove();
      link.connection = null;
    }
    delete this.connectedElements[otherId];
  }

  this.getConnection = function(otherId) {
    return this.connectedElements[otherId]; 
  }
}

function removeElement(node) {
  var connections = node.connectedElements;
  for(var key in connections) {
    removeConnection(node, graph.getNode(key), false);
  }
  var toRemove = d3.select("#" + node.elementId);
  if(toRemove.classed("selected")) selectedElement = null;
  toRemove.remove();
  storeLocalChanges();
}

function addConnection(originNode, toNode, originSelection, toSelection) {
  var line = d3.select("#main-container").insert("line", "#bounding-rect")
  .classed("connection", true)
  .attr("x1", originSelection.attr("x"))
  .attr("y1", originSelection.attr("y"))
  .attr("x2", toSelection.attr("x"))
  .attr("y2", toSelection.attr("y"))
  .attr("marker-end", "url(#arrowhead)");

  originNode.addConnection(toSelection.attr("id"), line, false);
  toNode.addConnection(originSelection.attr("id"), line, true);
  storeLocalChanges();
}

function removeConnection(originNode, toNode, store) {
  originNode.removeConnection(toNode.elementId);
  toNode.removeConnection(originNode.elementId);
  if(store) storeLocalChanges();
}

/***
* End Node/Link Storage
***/

/***
* SVG Event Handlers
***/
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
        var updatedSelection = d3.select(this).classed("selected", true);
        var selectedNode = graph.getNode(selectedElement.attr("id"));
        var updatedNode = graph.getNode(this.id);
        if(selectedNode.getConnection(this.id) === undefined) {
          addConnection(selectedNode, updatedNode, selectedElement, updatedSelection);
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
      var element = d3.select("#main-container").append("g").call(drag).on("click", elementClickHandler)
      .attr("x", x).attr("y", y).attr("data-scale", 3)
      .attr("transform", "translate(" + x + "," + y + ") scale(3)")
      .attr("id", "el-" + elementIdCounter++)
      .classed("node", true);

      graph.addNode(new GraphNode(element.attr("id")));
      element
      .append("circle")
      .attr("r", 30).attr("stroke", "black").attr("stroke-width", 1)
      .attr("fill", "#00FF00");
      var textarea = element.append("text").classed("node-text", true).attr("dy", -10)
      textarea.append("tspan").classed("node-title", true);
      textarea.append("tspan").classed("node-description", true).attr("x", 0).attr("dy", 5);

      storeLocalChanges();  
    }
  };

function zoomed() {
  d3.select("#main-container").attr("transform", "translate(" + d3.event.translate + ") scale(" + d3.event.scale + ")");
}

var currentlyDragged;
var connections;
function dragstarted(d) {
  d3.event.sourceEvent.stopPropagation();
  currentlyDragged = graph.getNode(this.id);
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
  for(var key in connections) {
    var link = connections[key];
    var connection = link.connection;
    if(link.isOrigin) {
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
  storeLocalChanges();
}

function initSVG(width, height) {
  var svg = d3.select("#main-content").append("svg")
  .attr("id", "main-svg")
  .style("width", width)
  .style("height", height)
  .append("g").attr("transform", "translate(0, 0)").call(zoom);

  d3.select("#main-svg").append("defs").append("marker")
  .attr("id", "arrowhead")
  .attr("viewBox", "0 -5 10 10")
    .attr("refX", 25)
    .attr("refY", 0)
    .attr("markerWidth", 6)
    .attr("markerHeight", 6)
    .attr("orient", "auto")
  .append("path")
    .attr("d", "M0,-5L10,0L0,5");

  var container = svg.append("g").attr("id", "main-container")
  .on("click", internalClickHandler);
}

/***
* End SVG Event Handlers
***/

/***
* Button Handlers
***/

function bindEvents() {
  $("#clear-map").click(function(){
    graph = new Graph();
    elementIdCounter = 0;
    $("#main-container g").remove();
    $("#main-container line").remove();
    selectedElement = null;
    storeLocalChanges();
  });

  $("#edit-node").click(function(){
    if(selectedElement !== null) {
      $("#edit-svg").empty();

      var editSvg = d3.select("#edit-svg");

      var translateX = parseInt(editSvg.attr("width")) / 2;
      var translateY = parseInt(editSvg.attr("height")) / 2;
      var translate = "translate(" + translateX + "," + translateY + ") scale(5)";
      
      var clonedNode = clone(selectedElement);
      clonedNode.attr("data-id", clonedNode.attr("id"));
      clonedNode.attr("id", "editable-node").attr("transform", translate).classed("selected", false);

      editSvg.append(function(d) {
        return clonedNode.node();
      });

      $("#node-title").val($("#editable-node .node-title").html());
      $("#node-description").val($("#editable-node .node-description").html());
      $("#node-color").val($("#editable-node > :first-child").attr("fill"));
    }
  });

  $(".scale-change").click(function(){
    if(selectedElement !== null) {
      var scale = parseInt(selectedElement.attr("data-scale"));
      if(this.id === "decrease-size") scale = Math.max(scale - 1, 1);
      else scale++;
      selectedElement.attr("data-scale", scale);
      selectedElement.attr("transform", selectedElement.attr("transform").split(" ")[0] + " scale(" + scale + ")");
      storeLocalChanges();
    }
  });

  $("#remove-node").click(function(){
    if(selectedElement !== null) {
      var node = graph.getNode(selectedElement.attr("id"));
      removeElement(node);
      $("#selected-options").fadeOut("fast");
    }
  });

  $("#node-title").on("input", function(){
    var val = $(this).val();
    $("#editable-node .node-title").html(val);
  });

  $("#node-description").on("input", function(){
    var val = $(this).val();
    $("#editable-node .node-description").html(val);
  });

  $("#node-color").on("input", function(){
    var val = $(this).val();
    $("#editable-node > :first-child").attr("fill", val);
  });

  $("#confirm-edit").click(function(){
    var replacement = $($("#editable-node").html());
    replacement.attr("id", replacement.attr("data-id"));
    var selected = $(".selected");
    selected.empty();
    selected.append(replacement);
    selected.html(selected.html());
  });

  $("#initial-name-edit").on("input", function(){
    var val = $(this).val();
    if(!val){
      $("#initial-confirm-name").attr("disabled", "disabled");
    }
    else {
      $("#initial-confirm-name").removeAttr("disabled");
      var found = false;
      for(var i = 0;i < window.localStorage.length;i++){
        if(val == window.localStorage.key(i)){
          found = true;
          $("#initial-replace-warning").fadeIn();
          break;  
        }
      }
      if(found === false) $("#initial-replace-warning").fadeOut(); 
    }
  });

  $("#initial-confirm-name").click(function(){
    graphName = $("#initial-name-edit").val();
    $("#initial-name-edit").val("");
    $(this).attr("disabled", "disabled");
    $("#initial-replace-warning").fadeOut();

    var mainContainer = $("#main-container");
    mainContainer.empty();
    $("#idea-name").text(graphName);
    d3.select("#main-container").append("rect").attr("width", width).attr("height", height).attr("id", "bounding-rect");
    $.mobile.changePage($("#svg-page"), {transition: "slide"});
    graph = new Graph();
    storeLocalChanges();
    populateList();
  });

  $("#confirm-delete").click(function(){
    var popup = $("#delete-map-popup");
    var key = popup.attr("data-graph");
    delete window.localStorage[key];
    populateList();
    popup.popup("close");
  });

  $("#idea-name-change").click(function(){
    var name = $("#idea-name").text();
    $("#idea-name-edit").val(name);
  });

  $("#idea-name-edit").on("input", function(){
    var val = $(this).val();
    if(!val){
      $("#confirm-name").attr("disabled", "disabled");
    }
    else {
      $("#confirm-name").removeAttr("disabled");
      var found = false;
      for(var i = 0;i < window.localStorage.length;i++){
        if(val === window.localStorage.key(i) && val !== graphName){
          found = true;
          $("#replace-warning").fadeIn();
          break;  
        }
      }
      if(found === false) $("#replace-warning").fadeOut(); 
    }
  });

  $("#confirm-name").click(function(){
    var newKey = $("#idea-name-edit").val();
    if(newKey !== graphName){
      window.localStorage[newKey] = window.localStorage[graphName];
      delete window.localStorage[graphName];
      graphName = newKey;
      $("#idea-name").text(graphName);
      populateList();
    }
    $("#replace-warning").fadeOut();
    $("#idea-name-popup").popup("close");
  });
}

function populateList() {
  var list = $("#graph-list");
  $(".graph-list-item").parent().remove();
  for(var i = 0;i < localStorage.length;i++){
    var key = localStorage.key(i);
    var listItem = $('<li>' +
                          '<a class="graph-list-item">' + key + '</a>' +
                          '<a href="#delete-map-popup" data-graph="' + key + '" class="delete-list-item" data-rel="popup" data-position-to="window" data-transition="pop"></a>' +
                      '</li>');
    list.prepend(listItem);
  }
  list.listview("refresh");

  $(".graph-list-item").click(function(){
    graphName = $(this).text();
    var mainContainer = $("#main-container");
    mainContainer.empty();
    $("#idea-name").text(graphName);
    $.mobile.changePage($("#svg-page"), {transition: "slide"});
    initFromStorage();
  });

  $(".delete-list-item").click(function(){
    var key = $(this).attr("data-graph");
    $("#delete-map-name").text(key);
    $("#delete-map-popup").attr("data-graph", key);
  });
}

/***
* End Button Handlers
***/

/***
* Page Init Functions
***/

$('#list-page').live('pageinit', function(event) {
  var availWidth = screen.availWidth;
  var availHeight = screen.availHeight - $("#header").height() - $("#footer").height();

  width = availWidth * 3;
  height = availHeight * 3;

  populateList();

  var mainContent = $("#main-content");
  mainContent.css("width", "100%");
  mainContent.css("height", availHeight + "px");
  initSVG(width, height);
  bindEvents();
});

function init() {
    var onDeviceReady = function() {

    };

    var updateScreen = function() {

    };

    window.addEventListener("orientationchange", function(e){
        updateScreen();
    }, false);

    document.addEventListener("deviceready", onDeviceReady, true);
}

/***
* End Page Init Functions
***/

/**
* Random Functions
***/

function clone(selectedElement) {
  return d3.select(selectedElement.node().cloneNode(true));
}