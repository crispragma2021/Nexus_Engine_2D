import * as React from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, TransformControls, ContactShadows } from "@react-three/drei";
import { Physics, RigidBody } from "@react-three/rapier";
import type { Group } from "three";
import { useEditor } from "@/lib/editor/store";
import type { GDInstance, GDObjectDef, GDMesh3DType } from "@/lib/editor/types";
import { SelectionOverlay } from "./SelectionOverlay";
import { MousePointer, Move, RotateCcw, Scale, Plus, Sparkles, Box } from "lucide-react";
import { AssetCatalog3DModal } from "./AssetCatalog3DModal";

interface InstanceMeshProps {
  instance: GDInstance;
  objectDef?: GDObjectDef | undefined;
  isSelected: boolean;
  gizmoMode: "select" | "translate" | "rotate" | "scale";
  onSelect: (id: string) => void;
  onTransformChange: (
    id: string,
    pos: { x: number; y: number; z: number },
    rot: { x: number; y: number; z: number },
    scale: { x: number; y: number; z: number },
  ) => void;
}

function InstanceMesh3D({
  instance,
  objectDef,
  isSelected,
  gizmoMode,
  onSelect,
  onTransformChange,
}: InstanceMeshProps) {
  const meshRef = React.useRef<Group>(null);

  const posX = instance.position3d?.x ?? (instance.x - 400) / 100;
  const posY = instance.position3d?.y ?? (-instance.y + 300) / 100;
  const posZ = instance.position3d?.z ?? instance.zOrder * 0.1;

  const rotX = ((instance.rotation3d?.x ?? 0) * Math.PI) / 180;
  const rotY = ((instance.rotation3d?.y ?? instance.angle) * Math.PI) / 180;
  const rotZ = ((instance.rotation3d?.z ?? 0) * Math.PI) / 180;

  const scaleX = instance.scale3d?.x ?? (instance.width ? instance.width / 64 : 1);
  const scaleY = instance.scale3d?.y ?? (instance.height ? instance.height / 64 : 1);
  const scaleZ = instance.scale3d?.z ?? 1;

  const meshType: GDMesh3DType = objectDef?.meshType3D ?? "box";
  const color = objectDef?.material3D?.color ?? (isSelected ? "#FDE047" : "#478CBF");
  const roughness = objectDef?.material3D?.roughness ?? 0.3;
  const metalness = objectDef?.material3D?.metalness ?? 0.2;
  const wireframe = objectDef?.material3D?.wireframe ?? false;

  const renderGeometry = () => {
    switch (meshType) {
      case "sphere":
        return <sphereGeometry args={[0.6, 32, 32]} />;
      case "cylinder":
        return <cylinderGeometry args={[0.5, 0.5, 1, 32]} />;
      case "cone":
        return <coneGeometry args={[0.6, 1.2, 32]} />;
      case "torus":
        return <torusGeometry args={[0.5, 0.2, 16, 32]} />;
      case "plane":
        return <planeGeometry args={[1.5, 1.5]} />;
      case "box":
      default:
        return <boxGeometry args={[1, 1, 1]} />;
    }
  };

  const meshContent = (
    <mesh castShadow receiveShadow>
      {renderGeometry()}
      <meshStandardMaterial
        color={color}
        roughness={roughness}
        metalness={metalness}
        wireframe={wireframe}
      />
    </mesh>
  );

  const physicsType = objectDef?.physics3D?.bodyType ?? "none";
  const isPhysics = physicsType !== "none";
  const rigidBodyType = physicsType === "rigid" ? "dynamic" : physicsType === "static" ? "fixed" : "kinematicPosition";
  const colliderType = meshType === "sphere" ? "ball" : "cuboid";

  return (
    <>
      <group
        ref={meshRef}
        position={[posX, posY, posZ]}
        rotation={[rotX, rotY, rotZ]}
        scale={[scaleX, scaleY, scaleZ]}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(instance.id);
        }}
      >
        {isPhysics ? (
          <RigidBody type={rigidBodyType as any} colliders={colliderType}>
            {meshContent}
          </RigidBody>
        ) : (
          meshContent
        )}
      </group>

      {isSelected && gizmoMode !== "select" && meshRef.current && (
        <TransformControls
          object={meshRef.current}
          mode={gizmoMode as "translate" | "rotate" | "scale"}
          onObjectChange={() => {
            if (meshRef.current) {
              const p = meshRef.current.position;
              const r = meshRef.current.rotation;
              const s = meshRef.current.scale;
              onTransformChange(
                instance.id,
                { x: Number(p.x.toFixed(2)), y: Number(p.y.toFixed(2)), z: Number(p.z.toFixed(2)) },
                {
                  x: Number(((r.x * 180) / Math.PI).toFixed(1)),
                  y: Number(((r.y * 180) / Math.PI).toFixed(1)),
                  z: Number(((r.z * 180) / Math.PI).toFixed(1)),
                },
                { x: Number(s.x.toFixed(2)), y: Number(s.y.toFixed(2)), z: Number(s.z.toFixed(2)) },
              );
            }
          }}
        />
      )}
    </>
  );
}

export function SceneCanvas3D() {
  const { scene, ui, dispatch } = useEditor();
  const selectedId = ui.selectedInstanceIds[0];

  const handleSelect = (instanceId: string) => {
    dispatch({ type: "ui", patch: { selectedInstanceIds: [instanceId] } });
  };

  const handleTransformChange = (
    instanceId: string,
    pos: { x: number; y: number; z: number },
    rot: { x: number; y: number; z: number },
    scale: { x: number; y: number; z: number },
  ) => {
    dispatch({
      type: "updateInstance",
      id: instanceId,
      patch: {
        position3d: pos,
        rotation3d: rot,
        scale3d: scale,
        x: Math.round(pos.x * 100 + 400),
        y: Math.round(-pos.y * 100 + 300),
        angle: rot.y,
        width: Math.round(scale.x * 64),
        height: Math.round(scale.y * 64),
      },
    });
  };

  const setGizmoMode = (mode: "select" | "translate" | "rotate" | "scale") => {
    dispatch({ type: "ui", patch: { gizmoMode3D: mode } });
  };

  return (
    <div
      className="relative flex-1 bg-[#1A1A24] w-full h-full overflow-hidden"
      onClick={() => dispatch({ type: "ui", patch: { selectedInstanceIds: [] } })}
    >
      <Canvas camera={{ position: [4, 4, 6], fov: 50 }} shadows>
        <OrbitControls makeDefault />
        <color attach="background" args={["#161620"]} />
        <ambientLight intensity={0.7} />
        <directionalLight position={[10, 15, 10]} intensity={1.5} castShadow />
        <pointLight position={[-10, -10, -10]} intensity={0.5} />

        <Physics paused={true}>
          {/* Dynamic Instances 3D */}
          {scene.instances.map((inst) => {
            const objDef = scene.objects.find((o) => o.id === inst.objectId);
            // Render hierarchical instances? (For now, just render them flat but apply parent offsets later if needed)
            return (
              <InstanceMesh3D
                key={inst.id}
                instance={inst}
                objectDef={objDef}
                isSelected={inst.id === selectedId}
                gizmoMode={ui.gizmoMode3D ?? "translate"}
                onSelect={handleSelect}
                onTransformChange={handleTransformChange}
              />
            );
          })}
        </Physics>

        <gridHelper args={[40, 40, "#555566", "#2A2A38"]} />
        <ContactShadows position={[0, -0.01, 0]} opacity={0.7} scale={30} blur={1.5} far={10} />
      </Canvas>

      {/* Top Banner */}
      <div className="absolute top-2 left-2 flex items-center gap-2 bg-black/60 backdrop-blur text-white text-[11px] px-3 py-1.5 rounded-lg border border-separator shadow-lg pointer-events-auto">
        <Box className="h-4 w-4 text-[#478CBF]" />
        <span className="font-semibold">Godot 3D Viewport</span>
        <span className="text-text-secondary">· Escena: {scene.name}</span>
        <span className="text-text-placeholder">({scene.instances.length} Nodos)</span>
      </div>

      {/* 3D Gizmo Mode Toolbar (Q / W / E / R) */}
      <div className="absolute top-2 right-2 flex flex-col gap-1 bg-[#25252E] p-1.5 rounded-lg border border-separator shadow-xl pointer-events-auto">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setGizmoMode("select");
          }}
          className={`h-8 w-8 flex items-center justify-center rounded-md transition-all ${
            ui.gizmoMode3D === "select"
              ? "bg-[#478CBF] text-white shadow"
              : "text-text-secondary hover:bg-[#32323E] hover:text-white"
          }`}
          title="Modo Selección (Q)"
        >
          <MousePointer className="h-4 w-4" />
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            setGizmoMode("translate");
          }}
          className={`h-8 w-8 flex items-center justify-center rounded-md transition-all ${
            ui.gizmoMode3D === "translate"
              ? "bg-[#478CBF] text-white shadow"
              : "text-text-secondary hover:bg-[#32323E] hover:text-white"
          }`}
          title="Modo Desplazar / Mover (W)"
        >
          <Move className="h-4 w-4" />
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            setGizmoMode("rotate");
          }}
          className={`h-8 w-8 flex items-center justify-center rounded-md transition-all ${
            ui.gizmoMode3D === "rotate"
              ? "bg-[#478CBF] text-white shadow"
              : "text-text-secondary hover:bg-[#32323E] hover:text-white"
          }`}
          title="Modo Rotar (E)"
        >
          <RotateCcw className="h-4 w-4" />
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            setGizmoMode("scale");
          }}
          className={`h-8 w-8 flex items-center justify-center rounded-md transition-all ${
            ui.gizmoMode3D === "scale"
              ? "bg-[#478CBF] text-white shadow"
              : "text-text-secondary hover:bg-[#32323E] hover:text-white"
          }`}
          title="Modo Escalar (R)"
        >
          <Scale className="h-4 w-4" />
        </button>
      </div>

      <SelectionOverlay />

      {/* Render 3D Asset Catalog Modal if opened */}
      {ui.dialog?.name === "assetCatalog3D" && (
        <AssetCatalog3DModal open={true} onClose={() => dispatch({ type: "closeDialog" })} />
      )}
    </div>
  );
}
