<?php

use Illuminate\Support\Facades\Route;
use Pterodactyl\BlueprintFramework\Extensions\betterserverfiltering;

Route::get('/servers', [betterserverfiltering\ServersController::class, 'index']);
Route::get('/users', [betterserverfiltering\ServersController::class, 'users']);
