<?php
// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>


namespace App\Mail;

use App\Models\Event;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class EventInvitation extends Mailable
{
    use Queueable, SerializesModels;

    public Event $event;

    public ?string $inviterEmail = null;

    /**
     * Public logo URL for the email header. Served from the backend's
     * public/ dir (PNG for broad email-client support — Outlook desktop
     * and Gmail do not render inline base64/webp). Null when APP_URL is
     * not configured, falling back to the text brand in the template.
     */
    public ?string $logoSrc = null;

    public function __construct(Event $event)
    {
        $this->event = $event;
        $this->inviterEmail = $event->user?->email;

        $url = trim((string) config('app.url'));

        if ($url !== '') {
            $this->logoSrc = rtrim($url, '/').'/assets/lifeline_v1.png';
        }
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "Invitación a evento: {$this->event->title}",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.event-invitation',
            text: 'emails.event-invitation-text',
        );
    }
}
