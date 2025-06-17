import React, { useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';

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

  const skinnedMesh = scene.getObjectByName('Wolf3D_Head');

  useFrame(() => {
    if (skinnedMesh?.morphTargetInfluences) {
      const index = skinnedMesh.morphTargetDictionary?.viseme_aa;
      if (index !== undefined) skinnedMesh.morphTargetInfluences[index] = mouthOpen;
    }
  });

  return <primitive object={scene} />;
};

const AvatarViewer = ({ url, mouthOpen }) => {
  return (
<Canvas style={{ width: '100%', height: '100%' }} camera={{ position: [0, 1.6, 4], fov: 35 }}>
  <ambientLight intensity={0.6} />
  <directionalLight position={[0, 2, 5]} intensity={1} />
  <OrbitControls enableZoom={false} enablePan={false} minPolarAngle={Math.PI / 2.5} maxPolarAngle={Math.PI / 2.5} />
  <AvatarModel url={url} mouthOpen={mouthOpen} />
</Canvas>
  );
};

export default AvatarViewer;