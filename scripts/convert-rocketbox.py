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
 action=source.animation_data.action.copy();action.name=actionname
 print('CLIP',actionname,len(action.fcurves),list((f.data_path,f.array_index) for f in action.fcurves)[:15])
 # Matching Rocketbox bone rotations; retain the avatar's own rest translations.
 for f in list(action.fcurves):
  if not f.data_path.startswith('pose.bones[') or '.location' in f.data_path or '.scale' in f.data_path:
   action.fcurves.remove(f)
 rig.animation_data_create();track=rig.animation_data.nla_tracks.new();track.name=actionname
 strip=track.strips.new(actionname,1,action);strip.name=actionname
 for o in imported:bpy.data.objects.remove(o,do_unlink=True)
for a in bpy.data.actions:
 if a.name not in ['Idle','Walk','Run'] and a.users==0:bpy.data.actions.remove(a)
bpy.ops.object.select_all(action='DESELECT')
rig.select_set(True)
for o in meshes:o.select_set(True)
bpy.context.view_layer.objects.active=rig
# Each NLA track becomes a named clip; no original FBX unit scaling or locomotion reaches gameplay.
bpy.ops.export_scene.gltf(filepath=str(out/(sex.lower()+'.glb')),export_format='GLB',use_selection=True,export_animations=True,export_animation_mode='NLA_TRACKS',export_nla_strips=True,export_force_sampling=True,export_image_format='AUTO',export_yup=True,export_skins=True,export_morph=False)
