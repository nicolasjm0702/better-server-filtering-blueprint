<?php

namespace Pterodactyl\BlueprintFramework\Extensions\betterserverfiltering;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Pterodactyl\Http\Controllers\Api\Client\ClientApiController;
use Pterodactyl\Models\Server;
use Pterodactyl\Models\User;
use Pterodactyl\Transformers\Api\Client\ServerTransformer;

class ServersController extends ClientApiController
{
    private const SORT_COLUMNS = ['name', 'created_at', 'updated_at'];
    private const ADMIN_ONLY_FILTERS = ['all', 'others', 'user'];

    /**
     * Mirrors Pterodactyl\Http\Controllers\Api\Client\ClientController::index so the
     * response shape (and therefore the frontend's rawDataToServerObject/ServerRow/
     * Pagination handling of it) is identical to the stock dashboard's own servers list.
     */
    public function index(Request $request): array
    {
        $user = $request->user();
        $filter = $request->query('filter', 'mine');
        $sort = in_array($request->query('sort'), self::SORT_COLUMNS, true)
            ? $request->query('sort')
            : 'name';
        $dir = $request->query('dir') === 'desc' ? 'desc' : 'asc';

        abort_unless(
            !in_array($filter, self::ADMIN_ONLY_FILTERS, true) || $user->root_admin,
            403,
            'This filter requires administrator access.'
        );

        $transformer = $this->getTransformer(ServerTransformer::class);
        $query = Server::query()->with($this->getIncludesForTransformer($transformer, ['node']));

        switch ($filter) {
            case 'others':
                $query->whereNotIn('servers.id', $user->accessibleServers()->pluck('id')->all());
                break;
            case 'user':
                $query->where('owner_id', (int) $request->query('user_id'));
                break;
            case 'all':
                break;
            case 'mine':
            default:
                $query->where('owner_id', $user->id);
                break;
        }

        $servers = $query->orderBy($sort, $dir)->paginate(50)->appends($request->query());

        return $this->fractal->transformWith($transformer)->collection($servers)->toArray();
    }

    public function users(Request $request): JsonResponse
    {
        abort_unless($request->user()->root_admin, 403, 'This endpoint requires administrator access.');

        $term = (string) $request->query('query', '');
        if (strlen($term) < 2) {
            return response()->json([]);
        }

        $matches = User::query()
            ->where('username', 'LIKE', "%{$term}%")
            ->orWhere('email', 'LIKE', "%{$term}%")
            ->orderBy('username')
            ->limit(10)
            ->get(['id', 'username', 'email']);

        return response()->json($matches);
    }
}
