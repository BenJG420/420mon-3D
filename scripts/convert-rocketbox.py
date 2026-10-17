import bpy,sys,pathlib,math,json,hashlib
from mathutils import Vector
# Run: blender -b --python scripts/convert-rocketbox.py -- INPUT_DIR OUTPUT_DIR Male
args=sys.argv[sys.argv.index('--')+1:]
base=pathlib.Path(args[0]).resolve(); out=pathlib.Path(args[1]).resolve();out.mkdir(parents=True,exist_ok=True)
sex=args[2]; prefix='m002' if sex=='Male' else 'f001'; c=sex[0].lower()
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.fbx(filepath=str(base/(sex+'_Adult_01.fbx')))
rig=next(o for o in bpy.data.objects if o.type=='ARMATURE'); meshes=[o for o in bpy.data.objects if o.type=='MESH']
print('BASE',sex,tuple(rig.rotation_euler),tuple(rig.scale),[(b.name,b.rotation_mode,tuple(b.location)) for b in list(rig.pose.bones)[:3]])
rig.animation_data_clear()
for m in bpy.data.materials:
 if not m.use_nodes:continue
 nt=m.node_tree;bsdf=next(n for n in nt.nodes if n.type=='BSDF_PRINCIPLED');bsdf.inputs['Roughness'].default_value=.86;bsdf.inputs['Metallic'].default_value=0
 for inp in ['Normal','Specular IOR Level']:
  for link in list(bsdf.inputs[inp].links):nt.links.remove(link)
 for n in list(nt.nodes):
  if n.type=='TEX_IMAGE':
   if n.image and pathlib.Path(n.image.filepath).name in [prefix+'_'+x+'.tga' for x in ['body_color','head_color','opacity_color']]:
    n.image.filepath=str(base/pathlib.Path(n.image.filepath).name);n.image.reload();n.image.scale(1024,1024)
   else:nt.nodes.remove(n)
 for link in list(bsdf.inputs['Base Color'].links):nt.links.remove(link)
 tex=next((n for n in nt.nodes if n.type=='TEX_IMAGE'),None)
 if tex:
  nt.links.new(tex.outputs['Color'],bsdf.inputs['Base Color']);bsdf.inputs['Base Color'].default_value=(1,1,1,1)
  if 'opacity' in m.name:
   nt.links.new(tex.outputs['Alpha'],bsdf.inputs['Alpha']);m.surface_render_method='DITHERED'
for actionname,filename in [('Idle','idle_breathe_01'),('Walk','walk_neutral'),('Run','run_neutral')]:
 before=set(bpy.data.objects)
 bpy.ops.import_scene.fbx(filepath=str(base/(c+'_'+filename+'.max.fbx')))
 imported=set(bpy.data.objects)-before; source=next(o for o in imported if o.type=='ARMATURE')
 # FBX imports each clip's first frame as its own rest pose. Copying its
 # delta quaternions leaves the avatar in A-pose. Transfer absolute local
 # orientations into the target rest basis while keeping target bone lengths.
 source_action=source.animation_data.action
 start,end=map(int,source_action.frame_range)
 action=bpy.data.actions.new(actionname)
 rig.animation_data_create();rig.animation_data.use_nla=False;rig.animation_data.action=action
 previous={}
 for frame in range(start,end+1):
  bpy.context.scene.frame_set(frame)
  rotations={b.name:b.matrix.to_quaternion().normalized() for b in source.pose.bones}
  for bone in rig.pose.bones:
   if bone.name not in rotations:continue
   rest=bone.bone.matrix_local.copy()
   if bone.parent:rest=bone.parent.bone.matrix_local.inverted()@rest
   desired=rotations[bone.name]
   if bone.parent and bone.parent.name in rotations:desired=rotations[bone.parent.name].inverted()@desired
   q=(rest.to_quaternion().inverted()@desired).normalized()
   if bone.name in previous and previous[bone.name].dot(q)<0:q.negate()
   previous[bone.name]=q.copy();bone.rotation_mode='QUATERNION';bone.rotation_quaternion=q
   bone.keyframe_insert(data_path='rotation_quaternion',frame=frame,group=bone.name)
 for curve in action.fcurves:
  for point in curve.keyframe_points:point.interpolation='LINEAR'
 rig.animation_data.action=None
 track=rig.animation_data.nla_tracks.new();track.name=actionname
 strip=track.strips.new(actionname,start,action);strip.name=actionname
 for o in imported:bpy.data.objects.remove(o,do_unlink=True)
for a in bpy.data.actions:
 if a.name not in ['Idle','Walk','Run'] and a.users==0:bpy.data.actions.remove(a)
rig.animation_data.use_nla=True
bpy.context.scene.frame_set(1)
bpy.ops.object.select_all(action='DESELECT')
rig.select_set(True)
for o in meshes:o.select_set(True)
bpy.context.view_layer.objects.active=rig
# Each NLA track becomes a named clip; no original FBX unit scaling or locomotion reaches gameplay.
bpy.ops.export_scene.gltf(filepath=str(out/(sex.lower()+'.glb')),export_format='GLB',use_selection=True,export_animations=True,export_animation_mode='NLA_TRACKS',export_nla_strips=True,export_force_sampling=True,export_image_format='AUTO',export_yup=True,export_skins=True,export_morph=False)

# Make the default GLTF node pose the actual first Idle sample as well, so
# initial bounds and pre-mixer rendering agree with the animation.
import struct
path=out/(sex.lower()+'.glb');raw=path.read_bytes();json_length=struct.unpack_from('<I',raw,12)[0]
asset=json.loads(raw[20:20+json_length]);bin_header=20+json_length;binary=raw[bin_header+8:]
idle=next(a for a in asset['animations'] if a['name']=='Idle')
for channel in idle['channels']:
 if channel['target']['path']!='rotation':continue
 sampler=idle['samplers'][channel['sampler']];accessor=asset['accessors'][sampler['output']];view=asset['bufferViews'][accessor['bufferView']]
 offset=view.get('byteOffset',0)+accessor.get('byteOffset',0)
 asset['nodes'][channel['target']['node']]['rotation']=list(struct.unpack_from('<4f',binary,offset))
encoded=json.dumps(asset,separators=(',',':')).encode();encoded+=b' '*((-len(encoded))%4)
path.write_bytes(struct.pack('<III',0x46546c67,2,12+8+len(encoded)+8+len(binary))+struct.pack('<II',len(encoded),0x4e4f534a)+encoded+struct.pack('<II',len(binary),0x004e4942)+binary)
