import {AfterViewInit, Component, ElementRef, numberAttribute, ViewChild} from '@angular/core';
import * as THREE from "three";
import {
  BoxGeometry,
  BufferGeometry,
  Mesh,
  MeshBasicMaterial,
  Object3DEventMap,
  PerspectiveCamera,
  Scene, Texture,
  WebGLRenderer
} from "three";

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss'],
})
export class MainComponent implements AfterViewInit {

  @ViewChild('threeCanvas')
  private canvasRef!: ElementRef;
  private scene!: Scene;
  private camera!: PerspectiveCamera;
  private renderer!: WebGLRenderer;
  private map!: Mesh<BufferGeometry, MeshBasicMaterial, Object3DEventMap>;

  constructor() {
  }

  ngAfterViewInit(): void {
    this.createScene();
    requestAnimationFrame((delay: DOMHighResTimeStamp) => this.render(delay));

  }

  private createScene() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

    this.renderer = new THREE.WebGLRenderer({canvas: this.canvasRef.nativeElement});
    this.renderer.setSize(window.innerWidth, window.innerHeight);

    const loader = new THREE.TextureLoader();
    loader.load('assets/texture/Heightmap_Bezier_line.png', (texture) => this.onTextureLoaded(texture))

  }

  private render(delay: DOMHighResTimeStamp) {
    this.renderer.render(this.scene, this.camera);

    requestAnimationFrame((delay) => this.render(delay))
  }

  private generateTerrain(imageData: ImageData) {
    console.log(`imageData -> width: ${imageData.width}, imageData -> height: ${imageData.height}, length: ${imageData.data.length}`)

    const indices: number[] = [];
    const vertices: number[] = [];
    const colors: number[] = [];

    let y: number;
    let divider: number = 90;
    let highest: number = 0;

    let ys: number[] = [];
    for (let z = 0; z < imageData.height; z++) {
      for (let x = 0; x < imageData.width; x++) {
        y = Number(imageData.data[(z * imageData.height + x) * 4]);
        y += Number(imageData.data[(z * imageData.height + x + 1) * 4]);
        y += Number(imageData.data[(z * imageData.height + x + 2) * 4]);

        ys.push(Number(y));
        highest = ((y > highest) ? Number(y) : highest);

        vertices.push(x, y/divider, z);
      }
    }

// for ( int x : ys){
    ys.forEach(function (valueOfColor: number) {
      let color = Number(valueOfColor / highest).toPrecision(3);
      let red: number, green: number, blue: number;


      red = Number(color);
      green = ((Number(color) < 0.5 && Number(color) > 0.2) ? (Number(color) * 2) : (Number(color)));
      blue = 1 - (Number(color));

      // untere 50% in grün
      // zwischen 50% und 80% in braun
      // oberhalb von 80% in weiß
      /*
      red = ((Number(color) > 0.8) ? Number(color) : ((Number(color) > 0.5) ? Number(165 / 255) * Number(color) : 0.1 * Number(color)));
      green = ((Number(color) > 0.8) ? Number(color) : ((Number(color) > 0.5) ? Number(42 / 255) * Number(color) : 0.9 * Number(color)));
      blue = ((Number(color) > 0.8) ? Number(color) : ((Number(color) > 0.5) ? Number(42 / 255) * Number(color) : 0.1 * Number(color)));
*/
      colors.push(red, green, blue, 1);
    });

    let heigthlength;
    for (let y = 0; y < imageData.width - 1; y++) {
      heigthlength = imageData.width * y;
      for (let x = 0; x < imageData.height - 1; x++) {
        indices.push(heigthlength + imageData.width + x);
        indices.push(heigthlength + x + 1);
        indices.push(heigthlength + x);

        indices.push(heigthlength + imageData.width + x);
        indices.push(heigthlength + imageData.width + x + 1);
        indices.push(heigthlength + x + 1);
      }
    }

    /*
    indices.push(32);// width
    indices.push(1); //decr by 1
    indices.push(1 - 1);
*/
    //2nd triangle

    const geometry = new THREE.BufferGeometry();
    geometry.setIndex(indices);
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(vertices), 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(new Float32Array(colors), 4));

    const material = new THREE.MeshBasicMaterial();
    material.vertexColors = true;
    material.wireframe = true;
    //material.lightMap = true;

    this.map = new THREE.Mesh(geometry, material);
    this.scene.add(this.map);
    this.scene.rotateY(0*Math.PI/180);
  }

  private dynamicCamera(x: number, z: number) {
    this.camera.position.x = x / 2;//16
    this.camera.position.y = (x + z) / 3;//32
    this.camera.position.z = z;
    this.camera.lookAt(x / 2, 0, z / 2);
  }

  private onTextureLoaded(texture: Texture) {
    console.log('texture loaded');
    const canvas = document.createElement('canvas');
    canvas.width = texture.image.width;
    canvas.height = texture.image.height;

    const context = canvas.getContext('2d') as CanvasRenderingContext2D;
    context.drawImage(texture.image, 0, 0);

    const data = context.getImageData(0, 0, canvas.width, canvas.height);
    console.log(data);
    this.dynamicCamera(data.height, data.width);
    this.generateTerrain(data);
  }
}
