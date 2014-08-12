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

  var zoom = d3.behavior.zoom()
  .scaleExtent([.15, 10])
  .on("zoom", zoomed);

  var internalClickHandler = function(){
    if(d3.event.defaultPrevented) return;
    var transformText = d3.select("#main-container").attr("transform");
    var xOffset, yOffset;
    if(transformText === null) {
      xOffset = 0;
      yOffset = 0;
    }
    else {
      xOffset = parseFloat(transformText.substring(transformText.indexOf("(") + 1, transformText.indexOf(",")));
      yOffset = parseFloat(transformText.substring(transformText.indexOf(",") + 1, transformText.indexOf(")")));
    }
    console.log(xOffset);
    console.log(yOffset);
    var location = d3.mouse(this);
    console.log(location);
    container.append("circle").attr("cx", parseInt(location[0]) + xOffset).attr("cy", parseInt(location[1]) + yOffset)
                              .attr("r", 10).attr("stroke", "black").attr("stroke-width", 3)
                              .attr("fill", "none");
  }

  var drag = d3.behavior.drag()
  .origin(function(d) { return d; })
  .on("dragstart", dragstarted)
  .on("drag", dragged)
  .on("dragend", dragended);

  var width = screen.availWidth * 3;
  var height = screen.availHeight * 3;
  var svg = d3.select("#main-content").append("svg")
  .attr("id", "main-svg")
  .style("width", width)
  .style("height", height)
  .append("g").attr("transform", "translate(0, 0)").call(zoom).on("click", internalClickHandler);

  var container = svg.append("g").attr("id", "main-container");
  container.append("rect").attr("width", width).attr("height", height).attr("id", "bounding-rect");

  function zoomed() {
    container.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
  }

  function dragstarted(d) {
    d3.event.sourceEvent.stopPropagation();
    d3.select(this).classed("dragging", true);
  }

  function dragged(d) {
    d3.select(this).attr("cx", d.x = d3.event.x).attr("cy", d.y = d3.event.y);
  }

  function dragended(d) {
    d3.select(this).classed("dragging", false);
  }
});
