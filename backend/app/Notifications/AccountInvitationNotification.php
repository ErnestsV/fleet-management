<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class AccountInvitationNotification extends Notification
{
    use Queueable;

    public function __construct(
        private readonly string $token,
    ) {
    }

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $frontendUrl = rtrim((string) config('app.frontend_url', config('app.url', 'http://localhost')), '/');
        $email = urlencode((string) $notifiable->getEmailForPasswordReset());
        $url = "{$frontendUrl}/reset-password?token={$this->token}&email={$email}";

        return (new MailMessage())
            ->subject('Your FleetOS account is ready')
            ->greeting('Welcome to FleetOS')
            ->line('A new account has been created for you.')
            ->line('Use the button below to set your password and activate your access.')
            ->action('Set your password', $url)
            ->line('If you were not expecting this invitation, you can ignore this email.');
    }
}
