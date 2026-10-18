import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

type Point = [number, number, number];
/** Small source-art sculpting toolkit. Each finished species is one colored mesh. */
export class Sculpt {
  private readonly parts: THREE.BufferGeometry[] = [];
  private add(geometry: THREE.BufferGeometry, color: THREE.ColorRepresentation, position: Point, scale: Point = [1, 1, 1], rotation: Point = [0, 0, 0]) {
    const transform = new THREE.Matrix4().compose(new THREE.Vector3(...position), new THREE.Quaternion().setFromEuler(new THREE.Euler(...rotation)), new THREE.Vector3(...scale));
    geometry.applyMatrix4(transform);
    const plain = geometry.index ? geometry.toNonIndexed() : geometry;
    if (plain !== geometry) geometry.dispose();
    plain.deleteAttribute("uv");
    const rgb = new THREE.Color(color), colors = new Float32Array(plain.getAttribute("position").count * 3);
    for (let i = 0; i < colors.length; i += 3) { colors[i] = rgb.r; colors[i + 1] = rgb.g; colors[i + 2] = rgb.b; }
    plain.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    this.parts.push(plain);
    return this;
  }
  ellipsoid(color: THREE.ColorRepresentation, x: number, y: number, z: number, sx: number, sy: number, sz: number) {
    return this.add(new THREE.SphereGeometry(1, 12, 8), color, [x, y, z], [sx, sy, sz]);
  }
  /** Closed upper half-ellipsoid: a smooth bell with a flat underside. */
  dome(color: THREE.ColorRepresentation, x: number, y: number, z: number, sx: number, sy: number, sz: number) {
    this.add(new THREE.SphereGeometry(1, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), color, [x, y, z], [sx, sy, sz]);
    return this.add(new THREE.CircleGeometry(1, 24), color, [x, y, z], [sx, sz, 1], [Math.PI / 2, 0, 0]);
  }
  /** Smooth curved cord with round, closed ends; existing rod geometry is unchanged. */
  tube(color: THREE.ColorRepresentation, points: Point[], radius = .02, segments = 32) {
    const curve = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)));
    this.add(new THREE.TubeGeometry(curve, segments, radius, 10, false), color, [0, 0, 0]);
    for (const p of [points[0], points[points.length - 1]]) this.ellipsoid(color, ...p, radius, radius, radius);
    return this;
  }
  /** Revolved profile; start/end at radius zero to close a solid, or repeat a ring profile. */
  lathe(color: THREE.ColorRepresentation, profile: [number, number][], x: number, y: number, z: number, rx = 0, ry = 0, rz = 0) {
    return this.add(new THREE.LatheGeometry(profile.map(p => new THREE.Vector2(...p)), 32), color, [x, y, z], [1, 1, 1], [rx, ry, rz]);
  }
  box(color: THREE.ColorRepresentation, x: number, y: number, z: number, sx: number, sy: number, sz: number, rx = 0, ry = 0, rz = 0) {
    return this.add(new THREE.BoxGeometry(1, 1, 1), color, [x, y, z], [sx, sy, sz], [rx, ry, rz]);
  }
  cone(color: THREE.ColorRepresentation, x: number, y: number, z: number, radius: number, height: number, rx = 0, ry = 0, rz = 0) {
    return this.add(new THREE.ConeGeometry(radius, height, 10), color, [x, y, z], [1, 1, 1], [rx, ry, rz]);
  }
  rod(color: THREE.ColorRepresentation, from: Point, to: Point, radius = .04) {
    const start = new THREE.Vector3(...from), end = new THREE.Vector3(...to), direction = end.clone().sub(start);
    if (direction.lengthSq() < .000001) return this;
    const geometry = new THREE.CylinderGeometry(radius, radius, direction.length(), 10);
    const rotation = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
    geometry.applyQuaternion(rotation);
    return this.add(geometry, color, start.add(end).multiplyScalar(.5).toArray() as Point);
  }
  /** Closed thin silhouette for scalloped membranes and metal/fabric plates. */
  panel(color: THREE.ColorRepresentation, points: Point[], depth = .035) {
    const shape = new THREE.Shape(points.map(([x, y]) => new THREE.Vector2(x, y)));
    return this.add(new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false }), color, [0, 0, points[0][2] - depth / 2]);
  }
  finish(): THREE.BufferGeometry {
    if (!this.parts.length) throw new Error("Ein Monster-Modell braucht seine eigene Form.");
    const geometry = mergeGeometries(this.parts, false);
    this.parts.forEach(part => part.dispose()); this.parts.length = 0;
    if (!geometry) throw new Error("Monster-Geometrie konnte nicht zusammengeführt werden.");
    geometry.computeBoundingBox();
    const bounds = geometry.boundingBox!, size = bounds.getSize(new THREE.Vector3());
    const scale = 1.6 / Math.max(size.x, size.y, size.z);
    const center = bounds.getCenter(new THREE.Vector3());
    geometry.translate(-center.x, -bounds.min.y, -center.z);
    geometry.scale(scale, scale, scale); geometry.translate(0, -.8, 0);
    geometry.computeBoundingBox(); geometry.computeBoundingSphere();
    return geometry;
  }
}
