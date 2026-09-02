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

    public function __construct(Event $event)
    {
        $this->event = $event;
        $this->inviterEmail = $event->user?->email;
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
            text: 'emails.event-invitation',
        );
    }
}