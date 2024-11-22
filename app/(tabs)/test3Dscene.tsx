import React, { useRef, useEffect } from "react";
import { View } from "react-native";
import { GLView } from "expo-gl";
import { Renderer } from "expo-three";

// @ts-ignore
import * as THREE from "three";

export default function test3Dscene() {
    // @ts-ignore
    const onContextCreate = (gl) => {
        const renderer = new Renderer({ gl });

        // @ts-ignore
        renderer.setSize(gl.drawingBufferWidth, gl.drawingBufferHeight);
      
        const scene = new THREE.Scene();
      
        const camera = new THREE.PerspectiveCamera(
          75,
          gl.drawingBufferWidth / gl.drawingBufferHeight,
          0.1,
          1000
        );
        camera.position.z = 5;
      
        const geometry = new THREE.BoxGeometry();
        const material = new THREE.MeshBasicMaterial({ color: 'tomato' });
        const cube = new THREE.Mesh(geometry, material);
        scene.add(cube);
      
        const animate = () => {
          requestAnimationFrame(animate);
      
          const offset = 0.05;

          cube.rotation.x += offset
          cube.rotation.y += offset
      
          // @ts-ignore
          renderer.render(scene, camera);
          gl.endFrameEXP();
        };
      
        animate();
      };
      

    return (
        <View style={{ flex: 1 }}>
            <GLView
                style={{ flex: 1 }}
                onContextCreate={onContextCreate}
            />
        </View>
    );
}
