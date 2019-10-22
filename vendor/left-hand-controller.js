let mouse = {x: 0, y: 0};
let el, self;

import {leftHandPosition} from './camera.js';
 
let previousLeftHandPosition = {x: 0, y: 0, z: -0.2};

AFRAME.registerComponent('left-hand-controller', {
    schema: {
        width: {type: 'number', default: 1},
        height: {type: 'number', default: 1},
        depth: {type: 'number', default: 1},
        color: {type: 'color', default: '#AAA'},
    },
    init: function () {
        var data = this.data;
        el = this.el;
        self = this;
    
        this.geometry = new THREE.BoxGeometry(data.width, data.height, data.depth);
        this.material = new THREE.MeshStandardMaterial({color: data.color});
        this.mesh = new THREE.Mesh(this.geometry, this.material);

        // Set mesh on entity.
        el.setObject3D('mesh', this.mesh);

        window.requestAnimationFrame(this.checkHands);
    },
    checkHands: function test() {
        if(leftHandPosition){
            if(leftHandPosition !== previousLeftHandPosition){
                self.onHandMove();
                previousLeftHandPosition = leftHandPosition;
            }
        }
        window.requestAnimationFrame(test);
    },
    onHandMove: function(){
        var camera = document.querySelector('#camera');
        var cameraEl = camera.object3D.children[1];

        const entities = document.querySelectorAll('[test]'); 
  
        mouse.x = (leftHandPosition.x / window.innerWidth) * 2 - 1;
        mouse.y = - (leftHandPosition.y / window.innerHeight) * 2 + 1;

        var vector = new THREE.Vector3(mouse.x, mouse.y, 0.5);
        vector.unproject(cameraEl);

        var cameraElPosition = cameraEl.el.object3D.position;
        var dir = vector.sub(cameraElPosition).normalize();
        var distance = - cameraElPosition.z / dir.z;
        var pos = cameraElPosition.clone().add(dir.multiplyScalar(distance));

        // position of the left hand.
        el.object3D.position.copy(pos);

        el.object3D.position.z = -0.2;

        // Raycasting
        // ------------------------
        const entitiesObjects = [];
        const leftHandVertices = el.object3D.el.object3D.children[0].geometry.vertices;
        const leftHandMesh = el.object3D.el.object3D.children[0];
        const leftHandPositionVector = el.object3D.position;

        if(Array.from(entities).length){
            for(var i = 0; i < Array.from(entities).length; i++){
                const beatMesh = entities[i].object3D.el.object3D.el.object3D.el.object3D.children[0].children[1];
                entitiesObjects.push(beatMesh);
            }
            
            var originPoint = leftHandPositionVector.clone();
            var directionVector;

             for (var vertexIndex = 0; vertexIndex < leftHandVertices.length; vertexIndex++) {
                var localVertex = leftHandVertices[vertexIndex].clone();
    
                var globalVertex = localVertex.applyMatrix4(leftHandMesh.matrix);
                var directionVector = globalVertex.sub(leftHandPositionVector);

                var ray = new THREE.Raycaster(originPoint, directionVector.clone().normalize());
                var collisionResults = ray.intersectObjects(entitiesObjects);
                if (collisionResults.length > 0 && collisionResults[0].distance < directionVector.length()) {
                    const beat = collisionResults[0].object.el.attributes[0].ownerElement.parentEl.components.beat;
                    const beatColor = beat.attrValue.color;
                    const beatType = beat.attrValue.type;

                    if(beatColor === "red"){
                        if(beatType === "arrow" || beatType === "dot"){
                            beat.destroyBeat();
                        } 
                    }
                }
            }
        }
    },
});