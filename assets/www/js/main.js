/* Copyright (c) 2012 Mobile Developer Solutions. All rights reserved.
 * This software is available under the MIT License:
 * The MIT License
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software
 * and associated documentation files (the "Software"), to deal in the Software without restriction,
 * including without limitation the rights to use, copy, modify, merge, publish, distribute,
 * sublicense, and/or sell copies of the Software, and to permit persons to whom the Software
 * is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies
 * or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED,
 * INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR
 * PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE
 * FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE,
 * ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

 $('#page-home').live('pageinit', function(event) {
  var mainContent = $("#main-content");
  mainContent.css("width", "100%");
  mainContent.css("height", screen.availHeight * .6 + "px");

  var selectedElement = null;

  var zoom = d3.behavior.zoom()
  .scaleExtent([.15, 10])
  .on("zoom", zoomed);

  var drag = d3.behavior.drag()
  .origin(function() {
    var t = d3.select(this);
    return {x: t.attr("cx"), y: t.attr("cy")};
  })
  .on("dragstart", dragstarted)
  .on("drag", dragged)
  .on("dragend", dragended);

  var elementClickHandler = function() {
    if(d3.event.defaultPrevented) return;
    if(selectedElement !== null) selectedElement.classed("selected", false);
    selectedElement = d3.select(this);
    selectedElement.classed("selected", true);
  };

  var internalClickHandler = function() {
    if(d3.event.defaultPrevented) return;
    if(selectedElement !== null) {
     if(d3.event.toElement.id === "bounding-rect"){
       selectedElement.classed("selected", false);
       selectedElement = null;	    
     }
   }
   else {
    var location = d3.mouse(this);
    container.append("g").append("circle").attr("cx", location[0]).attr("cy", location[1])
    .attr("r", 10).attr("stroke", "black").attr("stroke-width", 3)
    .attr("fill", "green").call(drag).on("click", elementClickHandler);
  }
};

function zoomed() {
  d3.select("#main-container").attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
}

function dragstarted(d) {
  d3.event.sourceEvent.stopPropagation();
  d3.select(this).classed("dragging", true);
}

function dragged() {
  var el = d3.select(this);
  el.attr("cx", d3.event.x);
  el.attr("cy", d3.event.y);
}

function dragended(d) {
  d3.event.sourceEvent.stopPropagation();
  d3.select(this).classed("dragging", false);
}

var width = screen.availWidth * 3;
var height = screen.availHeight * 3;
var svg = d3.select("#main-content").append("svg")
.attr("id", "main-svg")
.style("width", width)
.style("height", height)
.append("g").attr("transform", "translate(0, 0)").call(zoom);

var container = svg.append("g").attr("id", "main-container").on("click", internalClickHandler);
container.append("rect").attr("width", width).attr("height", height).attr("id", "bounding-rect");
});
