{{-- SPDX-License-Identifier: AGPL-3.0-only --}}
{{-- Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz> --}}
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Invitación a evento: {{ $event->title }}</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f6f8;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6f8;padding:32px 16px;">
        <tr>
            <td align="center">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background-color:#ffffff;border-radius:12px;border:1px solid #e5e7eb;">
                    <!-- Header -->
                    <tr>
                        <td align="center" style="padding:36px 32px 8px;">
                            @if ($logoSrc)
                                <img src="{{ $logoSrc }}" alt="LifeLine" style="display:block;max-height:80px;width:auto;max-width:320px;border:0;outline:none;text-decoration:none;" />
                            @else
                                <span style="font-size:20px;font-weight:700;color:#111827;letter-spacing:0.5px;">LifeLine</span>
                            @endif
                        </td>
                    </tr>
                    <!-- Body -->
                    <tr>
                        <td style="padding:20px 40px 24px;">
                            <p style="margin:0 0 16px;color:#4b5563;font-size:15px;line-height:1.6;">Hola,</p>
                            <p style="margin:0 0 16px;color:#4b5563;font-size:15px;line-height:1.6;">
                                Has sido invitado/a al siguiente evento en LifeLine:
                            </p>
                            <!-- Event card -->
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 20px;">
                                <tr>
                                    <td style="padding:16px 20px;background-color:#eef4ff;border-left:4px solid #3880ff;border-radius:0 8px 8px 0;">
                                        <p style="margin:0 0 8px;color:#111827;font-size:18px;font-weight:700;line-height:1.4;">{{ $event->title }}</p>
                                        @if ($event->date_start)
                                        <p style="margin:0;color:#4b5563;font-size:14px;line-height:1.6;">
                                            <strong>Fecha de inicio:</strong> {{ $event->date_start->format('d/m/Y H:i') }}
                                        </p>
                                        @endif
                                        <p style="margin:4px 0 0;color:#4b5563;font-size:14px;line-height:1.6;">
                                            <strong>Invitado por:</strong> {{ $inviterEmail ?? 'Un usuario de LifeLine' }}
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <!-- Footer -->
                    <tr>
                        <td style="padding:20px 40px 28px;background-color:#f9fafb;border-top:1px solid #e5e7eb;">
                            <p style="margin:0 0 8px;color:#6b7280;font-size:12px;line-height:1.6;">
                                Compartido a través de <a href="https://lifeline.dowar.xyz" style="color:#3880ff;text-decoration:none;font-weight:700;">LifeLine</a>. Si no esperabas esta invitación, puedes ignorar este mensaje.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
