import React, { useEffect, useState, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF, Environment } from '@react-three/drei';

const AvatarModel = ({ url, mouthOpen = 0 }) => {
  const { scene } = useGLTF(url);

  // Optional: center the model
  useEffect(() => {
    scene.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    // Scale and reposition the model
    scene.scale.set(1.5, 1.5, 1.5);      // 🔍 Scale the avatar up/down
    scene.position.set(0, -1.5, 0);      // 🔧 Move it up so feet align with base
  }, [scene]);

  // Log all scene objects to help identify the head mesh
  useEffect(() => {
    console.log('Scene structure:', scene);
    scene.traverse(object => {
      if (object.isMesh && object.morphTargetDictionary) {
        console.log('Found mesh with morph targets:', object.name, object.morphTargetDictionary);
      }
    });
  }, [scene]);

  // Find the head mesh - try different naming conventions for Akool avatars
  let skinnedMesh = null;
  scene.traverse(object => {
    if (object.isMesh && object.morphTargetDictionary) {
      // Check if this mesh has mouth-related morph targets
      const morphNames = Object.keys(object.morphTargetDictionary || {});
      if (morphNames.some(name => 
          name.includes('mouth') || 
          name.includes('Mouth') || 
          name.includes('jaw') || 
          name.includes('viseme'))) {
        skinnedMesh = object;
      }
    }
  });
  
  useFrame(() => {
    if (skinnedMesh?.morphTargetInfluences) {
      // Try different morph target names used by Akool avatars
      const morphDict = skinnedMesh.morphTargetDictionary || {};
      const morphNames = Object.keys(morphDict);
      
      // Find the best morph target for mouth opening
      const mouthMorphName = morphNames.find(name => 
        name === 'mouthOpen' || 
        name === 'MouthOpen' || 
        name === 'viseme_aa' ||
        name === 'jawOpen' ||
        name === 'mouthOpen_jawDrop' ||
        name.includes('mouth') && name.includes('open')
      ) || morphNames[0]; // Fallback to first morph
      
      const mouthOpenIndex = mouthMorphName ? morphDict[mouthMorphName] : 0;
      
      if (mouthOpenIndex !== undefined) {
        skinnedMesh.morphTargetInfluences[mouthOpenIndex] = mouthOpen;
        
        // If we have other facial expressions, use them based on avatar expression
        if (morphDict['browInnerUp']) {
          skinnedMesh.morphTargetInfluences[morphDict['browInnerUp']] = mouthOpen > 0.3 ? 0.5 : 0;
        }
      }
      
      // Debug - log once when speaking starts
      if (mouthOpen > 0.3 && !window.morphTargetsLogged) {
        console.log('Using morph target:', mouthMorphName);
        console.log('All available morphs:', morphDict);
        window.morphTargetsLogged = true;
      }
    }
  });

  return <primitive object={scene} />;
};

const AvatarViewer = ({ url, mouthOpen }) => {
  // Simplified to just use the provided URL without Akool integration
  const avatarUrl = url;

  return (
    <Canvas style={{ width: '100%', height: '100%' }} camera={{ position: [0, 1.6, 4], fov: 35 }}>
      <ambientLight intensity={0.6} />
      <directionalLight position={[0, 2, 5]} intensity={1} />
      <OrbitControls enableZoom={false} enablePan={false} minPolarAngle={Math.PI / 2.5} maxPolarAngle={Math.PI / 2.5} />
      <Suspense fallback={null}>
        <AvatarModel url={avatarUrl} mouthOpen={mouthOpen} />
        <Environment preset="city" />
      </Suspense>
    </Canvas>
  );
};

export default AvatarViewer;