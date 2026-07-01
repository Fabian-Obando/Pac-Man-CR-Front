import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: false
})

export class LoginPage {

  correo = '';

  password = '';

  mostrarPassword = false;

  constructor(private router: Router){}

  login(){

    if(this.correo.trim()=='' || this.password.trim()=='' ){

      alert("Debe completar todos los campos");

      return;

    }

    /*
      Aquí conectaremos el Backend
    */

    console.log(this.correo);

    console.log(this.password);

    this.router.navigate(['/menu']);

  }

}
