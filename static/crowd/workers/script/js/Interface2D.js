window.onload = function() {
	/* XZ view */
	var canvas = d3.select("#grid2d").append("canvas")
		.attr("id", "grid2d")
		.attr("width",  750)
		.attr("height", 800);

	context = canvas.node().getContext("2d");
	context.fillStyle =("white");

	context.font = "10px Effra";
	context.textAlign = "start";
	context.textBaseline = "hanging";

	context.beginPath();
	context.lineWidth="1";
	context.fillStyle = 'black';
	context.strokeStyle = 'white';
	context.fillRect(50, 100, 300, 300);

	document.getElementById("container").addEventListener('mousemove', function(evt) {
        var mousePos = getMousePos(evt);
        if ((mousePos.x >= 0 && mousePos.x <= 250) && (mousePos.y >= 0 && mousePos.y <= 250)){
        	//console.log(mousePos);
        	changeXZPlane(mousePos.x, mousePos.y, slicen);
        }
      }, false);

	function getMousePos(evt) {
        var rect = document.getElementById("container").getBoundingClientRect();
        return {
        	x: evt.clientX-rect.left - 110,
			y: evt.clientY-rect.top - 135
        };
      }

   function changeXZPlane(xPos, yPos){
	  	var xzurl = "";
	  	var ySlice = Math.floor(yPos/250*60);
		  
		  if (ySlice < 10) { 
		  	xzurl = 'slices/xz_000' + ySlice + '.jpg';}
		  else { 
			xzurl = 'slices/xz_00' + ySlice + '.jpg';}
        
        xzsq = new Image();

	    xzsq.src =  xzurl;

	    context.drawImage(xzsq, 50, 100, 300, 300);

	    /*drawnScribblesY[ySlice].scribbles.forEach(function(d){
			context.beginPath();
        	context.arc(d.x + 350, d.y, 5, 0, 2 * Math.PI, false);
         	context.fillStyle = 'yellow';
         	context.fill();
 	 	 })*/

 	    context.fillStyle = 'white';
		context.fillRect(xPos/250*300 + 50, 100, 1, 300); //vertical crosshair
		context.fillRect(50, slicen/60*300 + 100, 300, 1); //horizontal crosshair
    }


	/* Fashion show */
	var scene = new THREE.Scene();
	var camera = new THREE.PerspectiveCamera( 75, window.innerWidth/window.innerHeight, 0.1, 1000 );

	var renderer = new THREE.WebGLRenderer();
	renderer.setSize( window.innerWidth, window.innerHeight );
	document.body.appendChild( renderer.domElement );

	var geometry = new THREE.BoxGeometry( 1, 1, 1 );
	var material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
	var cube = new THREE.Mesh( geometry, material );
	scene.add( cube );

	camera.position.z = 5;

	var animate = function () {
		requestAnimationFrame( animate );

		cube.rotation.x += 0.1;
		cube.rotation.y += 0.1;

		renderer.render(scene, camera);
	};

	animate();

}