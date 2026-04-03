<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    public function createApplication()
    {
        putenv('APP_ENV=testing');
        putenv('APP_MAINTENANCE_DRIVER=file');
        putenv('BCRYPT_ROUNDS=4');
        putenv('BROADCAST_CONNECTION=null');
        putenv('CACHE_STORE=array');
        putenv('DB_CONNECTION=sqlite');
        putenv('DB_DATABASE=:memory:');
        putenv('DB_URL=');
        putenv('MAIL_MAILER=array');
        putenv('QUEUE_CONNECTION=sync');
        putenv('SESSION_DRIVER=array');
        putenv('PULSE_ENABLED=false');
        putenv('TELESCOPE_ENABLED=false');
        putenv('NIGHTWATCH_ENABLED=false');

        $_ENV['APP_ENV'] = 'testing';
        $_ENV['APP_MAINTENANCE_DRIVER'] = 'file';
        $_ENV['BCRYPT_ROUNDS'] = '4';
        $_ENV['BROADCAST_CONNECTION'] = 'null';
        $_ENV['CACHE_STORE'] = 'array';
        $_ENV['DB_CONNECTION'] = 'sqlite';
        $_ENV['DB_DATABASE'] = ':memory:';
        $_ENV['DB_URL'] = '';
        $_ENV['MAIL_MAILER'] = 'array';
        $_ENV['QUEUE_CONNECTION'] = 'sync';
        $_ENV['SESSION_DRIVER'] = 'array';
        $_ENV['PULSE_ENABLED'] = 'false';
        $_ENV['TELESCOPE_ENABLED'] = 'false';
        $_ENV['NIGHTWATCH_ENABLED'] = 'false';

        $_SERVER['APP_ENV'] = 'testing';
        $_SERVER['APP_MAINTENANCE_DRIVER'] = 'file';
        $_SERVER['BCRYPT_ROUNDS'] = '4';
        $_SERVER['BROADCAST_CONNECTION'] = 'null';
        $_SERVER['CACHE_STORE'] = 'array';
        $_SERVER['DB_CONNECTION'] = 'sqlite';
        $_SERVER['DB_DATABASE'] = ':memory:';
        $_SERVER['DB_URL'] = '';
        $_SERVER['MAIL_MAILER'] = 'array';
        $_SERVER['QUEUE_CONNECTION'] = 'sync';
        $_SERVER['SESSION_DRIVER'] = 'array';
        $_SERVER['PULSE_ENABLED'] = 'false';
        $_SERVER['TELESCOPE_ENABLED'] = 'false';
        $_SERVER['NIGHTWATCH_ENABLED'] = 'false';

        return parent::createApplication();
    }
}
