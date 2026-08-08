import { rawDataToServerObject, Server } from '@/api/server/getServer';
import http, { getPaginationSet, PaginatedResult } from '@/api/http';

export type Filter = 'all' | 'mine' | 'others' | 'user';

export interface FilteredServersParams {
    filter: Filter;
    userId?: number | null;
    sort: string;
    dir: 'asc' | 'desc';
    page: number;
}

export default ({ filter, userId, sort, dir, page }: FilteredServersParams): Promise<PaginatedResult<Server>> => {
    return new Promise((resolve, reject) => {
        http.get('/api/client/extensions/betterserverfiltering/servers', {
            params: { filter, user_id: userId ?? undefined, sort, dir, page },
        })
            .then(({ data }) =>
                resolve({
                    items: (data.data || []).map((datum: any) => rawDataToServerObject(datum)),
                    pagination: getPaginationSet(data.meta.pagination),
                })
            )
            .catch(reject);
    });
};

export interface UserMatch {
    id: number;
    username: string;
    email: string;
}

export const searchUsers = (query: string): Promise<UserMatch[]> => {
    return http.get('/api/client/extensions/betterserverfiltering/users', { params: { query } }).then(({ data }) => data);
};
