import React, { useEffect, useState } from 'react';
import { useStoreState } from 'easy-peasy';
import { ApplicationStore } from '@/state';
import { Server } from '@/api/server/getServer';
import { PaginatedResult } from '@/api/http';
import getServerResourceUsage from '@/api/server/getServerResourceUsage';
import ServerRow from '@/components/dashboard/ServerRow';
import Spinner from '@/components/elements/Spinner';
import Pagination from '@/components/elements/Pagination';
import FilterControls, { SortField, SortDir } from './FilterControls';
import getFilteredServers, { Filter } from './api/getFilteredServers';

const STORAGE_KEY = 'betterserverfiltering:filters';

interface StoredFilters {
    filter: Filter;
    onlineFirst: boolean;
    sortField: SortField;
    sortDir: SortDir;
}

const loadStoredFilters = (): StoredFilters => {
    try {
        return { filter: 'all', onlineFirst: true, sortField: 'name', sortDir: 'asc', ...JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') };
    } catch {
        return { filter: 'all', onlineFirst: true, sortField: 'name', sortDir: 'asc' };
    }
};

export default () => {
    const rootAdmin = useStoreState((state: ApplicationStore) => state.user.data?.rootAdmin ?? false);

    const [stored] = useState(loadStoredFilters);
    const [filter, setFilter] = useState<Filter>(stored.filter);
    const [onlineFirst, setOnlineFirst] = useState(stored.onlineFirst);
    const [sortField, setSortField] = useState<SortField>(stored.sortField);
    const [sortDir, setSortDir] = useState<SortDir>(stored.sortDir);
    const [userId, setUserId] = useState<number | null>(null);
    const [page, setPage] = useState(1);
    const [result, setResult] = useState<PaginatedResult<Server> | null>(null);

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ filter, onlineFirst, sortField, sortDir }));
    }, [filter, onlineFirst, sortField, sortDir]);

    // Hide the legacy "Showing your/other's servers"
    useEffect(() => {
        if (!rootAdmin) return;

        let frame: number | null = null;

        const hideLegacyDashboard = () => {
            const toggleInput = document.querySelector<HTMLInputElement>('input[name="show_all_servers"]');
            const toggleWrapper = toggleInput?.parentElement?.parentElement?.parentElement as HTMLElement | undefined;
            if (!toggleWrapper) return;

            toggleWrapper.style.display = 'none';
            let sibling = toggleWrapper.nextElementSibling as HTMLElement | null;
            while (sibling) {
                sibling.style.display = 'none';
                sibling = sibling.nextElementSibling as HTMLElement | null;
            }
        };

        const scheduleHide = () => {
            if (frame !== null) return;
            frame = requestAnimationFrame(() => {
                frame = null;
                hideLegacyDashboard();
            });
        };

        scheduleHide();

        const observer = new MutationObserver(scheduleHide);
        observer.observe(document.body, { childList: true, subtree: true });

        return () => {
            observer.disconnect();
            if (frame !== null) cancelAnimationFrame(frame);
        };
    }, [rootAdmin]);

    useEffect(() => {
        if (!rootAdmin) return;
        if (filter === 'user' && !userId) return;

        getFilteredServers({ filter, userId, sort: sortField, dir: sortDir, page }).then((fetched) => {
            if (!onlineFirst) {
                setResult(fetched);
                return;
            }

            // "Online first" needs live power state, which the paginated servers
            // endpoint doesn't carry
            Promise.all(
                fetched.items.map((server) =>
                    getServerResourceUsage(server.uuid)
                        .then((stats) => stats.status !== 'offline')
                        .catch(() => false)
                )
            ).then((onlineFlags) => {
                const withFlags = fetched.items.map((server, index) => ({ server, online: onlineFlags[index] }));
                withFlags.sort((a, b) => Number(b.online) - Number(a.online));
                setResult({ ...fetched, items: withFlags.map((entry) => entry.server) });
            });
        });
    }, [rootAdmin, filter, onlineFirst, sortField, sortDir, userId, page]);

    if (!rootAdmin) return null;

    return (
        <div className={'betterserverfiltering-panel'}>
            <FilterControls
                filter={filter}
                onlineFirst={onlineFirst}
                sortField={sortField}
                sortDir={sortDir}
                onFilterChange={(f) => {
                    setFilter(f);
                    setPage(1);
                }}
                onOnlineFirstChange={setOnlineFirst}
                onSortFieldChange={(f) => {
                    setSortField(f);
                    setPage(1);
                }}
                onSortDirChange={(d) => {
                    setSortDir(d);
                    setPage(1);
                }}
                onUserSelect={(id) => {
                    setUserId(id);
                    setPage(1);
                }}
            />
            {!result ? (
                <Spinner centered size={'large'} />
            ) : (
                <Pagination data={result} onPageSelect={setPage}>
                    {({ items }) =>
                        items.length > 0 ? (
                            items.map((server, index) => (
                                <ServerRow
                                    key={server.uuid}
                                    server={server}
                                    className={index > 0 ? 'mt-2' : undefined}
                                />
                            ))
                        ) : (
                            <p className={'text-center text-sm text-neutral-400'}>No servers match this filter.</p>
                        )
                    }
                </Pagination>
            )}
        </div>
    );
};
