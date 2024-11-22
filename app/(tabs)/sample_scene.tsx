import React, { useRef, useEffect } from "react";
import { View } from "react-native";
import { GLView } from "expo-gl";
import { Renderer } from "expo-three";

// @ts-ignore
import * as THREE from "three";

export default function sample_scene() {
    // @ts-ignore
    const onContextCreate = async (gl) => {
        // Create a WebGLRenderer
        const renderer = new Renderer({ gl });
        
        // @ts-ignore
        renderer.setSize(gl.drawingBufferWidth, gl.drawingBufferHeight);
        
        // Create a Scene
        const scene = new THREE.Scene();
        
        // Add a Camera
        const camera = new THREE.PerspectiveCamera(
            75,
            gl.drawingBufferWidth / gl.drawingBufferHeight,
            0.1,
            1000
        );
        camera.position.z = 5;
        
        // Add a Cube
        const geometry = new THREE.BoxGeometry();
        const material = new THREE.MeshBasicMaterial({ color: 'red' });
        const cube = new THREE.Mesh(geometry, material);
        scene.add(cube);
        
        // Animate the Cube
        const animate = () => {
            requestAnimationFrame(animate);
            
            cube.rotation.x += 0.01;
            cube.rotation.y += 0.01;
            
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
