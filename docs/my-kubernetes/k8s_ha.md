

```sh
# Install Aliyun yum repo for CentOS 7
cd /etc/yum.repos.d/
wget http://mirrors.aliyun.com/repo/Centos-7.repo
mv CentOS-Base.repo CentOS-Base.repo.bak
mv Centos-7.repo CentOS-Base.repo
yum clean all -y && yum makecache -y && yum update -y


# Install keepalived + haproxy
yum install keepalived haproxy -y

```

设置HAProxy日志

编辑 rsyslog 配置文件`/etc/rsyslog.conf`。
```sh
# 取消注释，打开 UDP syslog 的接收
$ModLoad imudp
$UDPServerRun 514
#......
# 添加设备 local3
# Add local3 as haproxy logging server.
local3.* /var/log/haproxy.log
```

编辑 rsyslog 设置`/etc/sysconfig/rsyslog`，来接收远程服务器日志。
```sh
#......
SYSLOGD_OPTIONS="-r -m 0"
```

重启 rsyslog
```sh
service rsyslog restart
```


haproxy 配置
```sh
#---------------------------------------------------------------------
# Example configuration for a possible web application.  See the
# full configuration options online.
#
#   http://haproxy.1wt.eu/download/1.4/doc/configuration.txt
#
#---------------------------------------------------------------------
global
    # to have these messages end up in /var/log/haproxy.log you will
    # need to:
    #
    # 1) Configure syslog to accept network log events.
    #    This is done by adding the '-r' option to the SYSLOGD_OPTIONS in `/etc/sysconfig/syslog`.
    #
    # 2) Configure local2 events to go to the `/var/log/haproxy.log` file.
    #    A line like the following can be added to `/etc/sysconfig/syslog`:
    #   
    #    local2.*                       /var/log/haproxy.log
    #
    # 这里表示使用 127.0.0.1 上的 rsyslog 服务中的 local3 日志设备，记录日志等级为 info。
    # local3 是日志设备，info 表示日志级别。有 err, warning, info, debug 4种日志级别。
    log     127.0.0.1 local3 info
    #chroot  /var/lib/haproxy     # HAProxy 安装目录
    pidfile /var/run/haproxy.pid  # 指定 HAProxy 进程ID的存放位置
    maxconn 65535                 # 设置每个 HAProxy 进程可接受的最大并发连接数
    user    nobody                # 设置启动 HAProxy 进程的用户
    group   nobody                # 设置启动 HAProxy 进程的组
    #uid     601                  # 设置启动 HAProxy 进程的用户ID（cat /etc/passwd 查看，这里是nobody的uid）
    #gid     601                  # 设置启动 HAProxy 进程的组ID（cat /etc/passwd 查看，这里是nobody的gid）
    daemon                        # 设置 HAProxy 进程进入后台运行，这是推荐的运行模式

    # turn on stats unix socket
    stats   socket /var/lib/haproxy/stats

defaults
    log     global
    mode    http              # 设置 HAProxy 实例默认的运行模式，有tcp, http, health三个可选值
    option  httplog           # 默认情况下，HAProxy日志是不记录HTTP请求的，此选项的作用是启用日志记录HTTP请求
    option  redispatch        # 此参数用于cookie保持的环境中。
                              # 在默认情况下，HAProxy会将其请求的后端服务器的serverID插入cookie中，以保证会话的session持久性。
                              # 而如果后端服务器出现故障，客户端的cookie是不会刷新的，这就会造成无法访问。
                              # 此时，如果设置了此参数，就会将客户的请求强制定向到另外一台健康的后端服务器上，以保证服务正常。
    option  http-server-close
    #option  forwardfor        except 127.0.0.0/8
    retries 3                 # 三次连接失败，则判断服务不可用
    timeout http-request      10s
    timeout queue             1m
    timeout connect           10s
    timeout client            1m
    timeout server            1m
    timeout http-keep-alive   10s
    timeout check             10s
    maxconn 65535

frontend monitor-in
    bind        *:33305
    mode        http
    option      httplog
    monitor-uri /monitor

frontend k8s-master
    bind            0.0.0.0:16443
    bind            127.0.0.1:16443
    mode            tcp
    option          tcplog
    tcp-request     inspect-delay   5s
    default_backend k8s-master

backend k8s-master
    mode tcp
    option tcplog
    option tcp-check
    balance roundrobin
    default-server inter 10s downinter 5s rise 2 fall 2 slowstart 60s maxconn 250 maxqueue 256 weight 100
    server k8s-master-hf-1 10.225.21.128:6443 check
    server k8s-master-hf-2 10.225.21.144:6443 check
    server k8s-master-hf-3 10.225.21.44:6443 check
    # server用于定义多台后端真实服务器，不能用于frontend和listen段
    # 格式如下：
    # server <name> <address>:<port> [param]
    # `<name>` 为后端真实服务器指定一个内部名称，随便定义一个即可
    # `<address>:<port>` 指定后端服务器的IP地址及端口
    # [param]参数:
    # check  表示启用对此后端服务器执行健康状态检查
    # inter  设置健康状态检查的时间间隔，单位是毫秒
    # rise   检查多少次认为服务器可用
    # fall   检查多少次认为服务器不可用
    # weight 设置服务器的权重，默认为1，最大为256。设置为0表示不参与负载均衡
    # backup 设置备份服务器，用于所有后端服务器全部不可用时
    # cookie 为指定的后端服务器设置cookie值，此处指定的值将在请求入站时被检查，第一次为此值挑选的后端服务器将在后续的请求中一直被选中，其目的在于实现持久连接的功能


```


Sample:
```sh
global
    log     127.0.0.1 local3 info
    pidfile /var/run/haproxy.pid
    maxconn 65535
    user    nobody
    group   nobody
    daemon
    stats   socket /var/lib/haproxy/stats

defaults
    log     global
    mode    http
    option  httplog
    option  redispatch
    option  http-server-close
    retries 3
    timeout http-request      10s
    timeout queue             1m
    timeout connect           10s
    timeout client            1m
    timeout server            1m
    timeout http-keep-alive   10s
    timeout check             10s
    maxconn 65535

frontend monitor-in
    bind        *:33305
    mode        http
    option      httplog
    monitor-uri /monitor

frontend k8s-master
    bind            0.0.0.0:16443
    bind            127.0.0.1:16443
    mode            tcp
    option          tcplog
    tcp-request     inspect-delay   5s
    default_backend k8s-master

backend k8s-master
    mode tcp
    option tcplog
    option tcp-check
    balance roundrobin
    default-server inter 10s downinter 5s rise 2 fall 2 slowstart 60s maxconn 250 maxqueue 256 weight 100
    server k8s-master-hf-1 10.225.21.128:6443 check
    server k8s-master-hf-2 10.225.21.144:6443 check
    server k8s-master-hf-3 10.225.21.44:6443 check

```



Keepalived

/etc/keepalived/keepalived.conf:
```sh
! Configuration File for keepalived
global_defs {
    router_id LVS_DEVEL
script_user root
    enable_script_security
}
vrrp_script chk_apiserver {
    script "/etc/keepalived/check_k8s_apiserver.sh"
    interval 5
    weight -5
    fall 2  
rise 1
}
vrrp_instance VI_1 {
    state MASTER
    interface eth0
    mcast_src_ip 10.225.21.128
    virtual_router_id 51
    priority 101
    advert_int 2
    authentication {
        auth_type PASS
        auth_pass K8SHA_KA_AUTH
    }
    virtual_ipaddress {
        10.225.21.128
    }
}

```
another config on master2
```sh
! Configuration File for keepalived
global_defs {
    router_id LVS_DEVEL
script_user root
    enable_script_security
}
vrrp_script chk_apiserver {
    script "/etc/keepalived/check_k8s_apiserver.sh"
    interval 5
    weight -5
    fall 2  
rise 1
}
vrrp_instance VI_1 {
    state BACKUP
    interface eth0
    mcast_src_ip 10.225.21.144
    virtual_router_id 51
    priority 100
    advert_int 2
    authentication {
        auth_type PASS
        auth_pass K8SHA_KA_AUTH
    }
    virtual_ipaddress {
        10.225.21.128
    }
}

```

测试脚本check_k8s_apiserver.sh
```sh
#!/bin/bash

err=0
for k in $(seq 1 3)
do
    check_code=$(pgrep haproxy)
    if [[ $check_code == "" ]]; then
        err=$(expr $err + 1)
        sleep 1
        continue
    else
        err=0
        break
    fi
done

if [[ $err != "0" ]]; then
    echo "systemctl stop keepalived"
    /usr/bin/systemctl stop keepalived
    exit 1
else
    exit 0
fi

```

设置为可执行
```sh
chmod +x /etc/keepalived/check_k8s_apiserver.sh
```

启动haproxy和keepalived
```sh
systemctl daemon-reload
systemctl enable --now haproxy
systemctl enable --now keepalived
```

`ping 10.225.21.128 -c 4`
`curl -k https://10.225.21.128:16443/livez?verbose`

`yum install nc -y`
`nc -v 10.225.21.128 16443
`






加入节点


生成/获取 kubeadm token
```sh
kubeadm token create && kubeadm token list
```

获取证书 hash
```sh
openssl x509 -pubkey -in /etc/kubernetes/pki/ca.crt | openssl rsa -pubin -outform der 2>/dev/null | \
   openssl dgst -sha256 -hex | sed 's/^.* //'
```

获取证书 key
```sh
kubeadm certs certificate-key
```

作为控制平面加入集群
```sh
kubeadm join 10.225.21.128:16443 --token ${token} \
    --discovery-token-ca-cert-hash sha256:${hash} \
    --control-plane --certificate-key ${key}
```


kubeadm join 10.225.21.128:16443 --token qsjxyh.g9ogxlk4mv0ehs4e \
--discovery-token-ca-cert-hash sha256:dadafac1a66ea22a9c5cf89c104e6988f9c3009a6a62c59ee14e22db5df23c79 \
--control-plane --certificate-key 6fc60f413f42a63d7de8d9376ec6c87f9087661c2f211d9e820fe52226bf809e
