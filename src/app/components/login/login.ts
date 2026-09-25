import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../auth/auth.service';

@Component({
  imports: [ReactiveFormsModule],
  selector: 'app-login',
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private readonly formBuilder = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  form = this.formBuilder.group({ phone: ['', Validators.required], password: ['', Validators.required], rememberMe: [false] });
  error = '';
  message = '';

  submit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.auth.login(this.form.value.phone ?? '', this.form.value.password ?? '', this.form.value.rememberMe ?? false).subscribe({
      next: (user) => {
        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
        const defaultUrl = user.role === 'engineer' ? '/engineer' : '/home';
        this.router.navigateByUrl(returnUrl || defaultUrl);
      },
      error: () => { this.error = 'تعذر تسجيل الدخول'; },
    });
  }

  forgotPassword() {
    const phone = this.form.value.phone ?? '';
    if (!phone) { this.error = 'اكتب رقم الجوال أولًا'; return; }
    this.auth.forgotPassword(phone).subscribe((result) => { this.error = ''; this.message = result.message; });
  }
}