---
category: 杂文
title: 使用特定的SSH Key提交GIT
date: 2020-11-24 20:43:00
---

1. 生成新的 ssh key，避免替换新的 sshkey

```
ssh-keygen -C "xxx@hotmail.com" -f ~/.ssh/id_rsa_gitee -P ""
```

2. 在 /Users/xxx/.ssh/config 文件里添加新的新的 Host

```
Host gitee.com
    HostName gitee.com
    User git
    IdentityFile /Users/xxx/.ssh/id_rsa_gitee
    IdentitiesOnly yes
```

3. 进入到仓库里，在 git 仓库里设置用户名密码

```
git config user.email "xxx@hotmail.com"
git config user.name "xxx"
```

4. 添加远程仓库

```
git remote add backup git@gitee.com:xxx-backup/xxx.201124.git
```

5. 测试

```
➜  xxx git:(master) ✗ git push backup
枚举对象: 478, 完成.
对象计数中: 100% (478/478), 完成.
使用 8 个线程进行压缩
压缩对象中: 100% (324/324), 完成.
写入对象中: 100% (478/478), 2.78 MiB | 5.84 MiB/s, 完成.
总共 478 （差异 147），复用 0 （差异 0）
remote: Resolving deltas: 100% (147/147), done.
remote: Powered by GITEE.COM [GNK-5.0]
To gitee.com:xxx-backup/xxx.201124.git
 * [new branch]      master -> master
```

上传脚本

```shell
#!/usr/bin/env bash

# Get the repos absolute path recursively
email="xxx@hotmail.com"
pwd="xxx"
cid="c65e97ab88de932e7c23e9d4b563e5c99b5926a06e26d2e8af26885bd5a6b1da"
csr="729aeae125864b5577a82629296ce7e389aab8bee5384c25a9fa2c2572064374"
username="xxx-backup"

get_repo_paths() {
    find . -type d -name ".git"
}

get_token() {
    curl -q -X POST --data-urlencode "grant_type=password" --data-urlencode "username=${email}" --data-urlencode "password=${pwd}" --data-urlencode "client_id=${cid}" --data-urlencode "client_secret=${csr}" --data-urlencode "scope=projects user_info issues notes" https://gitee.com/oauth/token | jq -r ".access_token"
}

push() {
    cd "$1"
    local datetime=`date +%y%m%d`
    local git_path="${PWD}"
    local local_path="${git_path%/.git*}"
    local repo_name="${local_path##*/}"
    local remote_path="git@gitee.com:${username}/${repo_name}.git"
    local http_path="https://gitee.com/${username}/${repo_name}.git"


    cd "${local_path}"


    echo "=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-="
    echo "> \`${repo_name}'"
    echo "  Local path : $PWD"
    echo "  Remote path: $remote_path"
    echo "  Http path: $http_path"
    echo "  Token: ${access_token}"
    echo "  RepoName: ${repo_name}"
    echo "= = = = = = = = = = = = = = = = = = = = = = = = = = ="
    echo ""


    curl -X POST -s\
         --header 'Content-Type: application/json;charset=UTF-8' 'https://gitee.com/api/v5/user/repos'\
         -d '{"access_token":"'${access_token}'","name":"'${repo_name}'","has_issues":"true","has_wiki":"true","can_comment":"true", "private":"true"}'


    git config user.email "xxx@hotmail.com"
    git config user.name "xxx"


    git remote rm backup
    git remote add backup "$remote_path"


    git push backup
    return_status=$?

    echo "= = = = = = = = = = = = = = = = = = = = = = = = = = ="

    return $return_status
}

die() {
    echo "> Fatal error!!!"
    exit 1
}

main() {
    access_token=$(get_token)

    get_repo_paths | while read p; do
        push "${p}" || die
    done
}

main

```
