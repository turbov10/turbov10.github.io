
# Kubernetes 集群搭建
Training of Cloud-Native Kubernetes for Development.

**内容提要**

* 容器运行时环境安装 (containerd)
* cgroup 驱动配置
* 在 Linux 系统中安装 kubectl 及其插件
* Kubernetes 未来展望

---

## 容器运行时环境安装 (containerd)

1. 安装 containerd
2. 安装 runc
3. 安装 CNI 插件
4. 配置 containerd

详见：[容器运行时安装](./k8s_installation_cr.md)

---

## 安装和配置先决条件

### 转发 IPv4 并让 iptables 看到桥接流量

为了让 Linux 节点的`iptables`能够正确查看桥接流量，请确认`sysctl`配置中的`net.bridge.bridge-nf-call-iptables`设置为 1。例如：
```sh
# Make folder to save installation packages and configuration files.
mkdir -p /usr/nzhong/k8s/config && cd /usr/nzhong/k8s/config

#cat <<EOF | sudo tee /etc/modules-load.d/k8s.conf
cat <<EOF | sudo tee /usr/nzhong/k8s/config/k8s_modules_load_d.conf
overlay
br_netfilter
EOF

cp k8s_modules_load_d.conf /etc/modules-load.d/k8s.conf
sudo modprobe overlay
sudo modprobe br_netfilter

## 设置所需的 sysctl 参数，参数在重新启动后保持不变
#cat > k8s_sysctl_d.conf <<EOF
#cat <<EOF | sudo tee /etc/sysctl.d/k8s.conf
#net.bridge.bridge-nf-call-iptables  = 1
#net.bridge.bridge-nf-call-ip6tables = 1
#net.ipv4.ip_forward                 = 1
#EOF
#
## 应用 sysctl 参数而不重新启动
#sudo sysctl --system

# 调整内核参数，配置K8S环境
cat > k8s_sysctl_d.conf <<EOF
net.bridge.bridge-nf-call-iptables=1
net.bridge.bridge-nf-call-ip6tables=1
net.ipv4.ip_forward=1
net.ipv4.tcp_tw_recycle=0
vm.swappiness=0 #禁止使用swap空间，只有当系统OOM时才允许使用
vm.overcommit_memory=1 #不检查物理内存是否够用
vm.panic_on_oom=0
fs.inotify.max_user_instances=8192
fs.inotify.max_user_watches=1048576
fs.file-max=52706963
fs.nr_open=52706963
net.ipv6.conf.all.disable_ipv6=1
net.netfilter.nf_conntrack_max=2310720
EOF

cp k8s_sysctl_d.conf /etc/sysctl.d/kubernetes.conf
sysctl -p /etc/sysctl.d/kubernetes.conf
```

### cgroup 驱动配置

kubelet 和容器运行时需要使用一个 cgroup 驱动。
关键的一点是 kubelet 和容器运行时需使用相同的 cgroup 驱动并且采用相同的配置。 可用的 cgroup 驱动有两个：

* cgroupfs
* systemd

<https://kubernetes.io/zh-cn/docs/setup/production-environment/container-runtimes/#cgroup-drivers>

#### cgroupfs 驱动

cgroupfs 驱动是 kubelet 中**默认的 cgroup 驱动**。当使用 cgroupfs 驱动时，kubelet 和容器运行时将直接对接 cgroup 文件系统来配置 cgroup。

**当 systemd 是初始化系统时，不推荐使用 cgroupfs 驱动**，因为 systemd 期望系统上只有一个 cgroup 管理器。
此外，如果你使用 cgroup v2，则应用 systemd cgroup 驱动取代 cgroupfs。

#### systemd cgroup 驱动

同时存在两个 cgroup 管理器将造成系统中针对可用的资源和使用中的资源出现两个视图。
某些情况下，将 kubelet 和容器运行时配置为使用 cgroupfs、但为剩余的进程使用 systemd 的那些节点将在资源压力增大时变得不稳定。

当 systemd 是选定的初始化系统时，缓解这个不稳定问题的方法是针对 kubelet 和容器运行时将 systemd 用作 cgroup 驱动。

要将 systemd 设置为 cgroup 驱动，需编辑 KubeletConfiguration 的 cgroupDriver 选项，并将其设置为 systemd。例如：
```yaml
apiVersion: kubelet.config.k8s.io/v1beta1
kind: KubeletConfiguration
#...
cgroupDriver: systemd
```

如果你将 systemd 配置为 kubelet 的 cgroup 驱动，你也必须将 systemd 配置为容器运行时的 cgroup 驱动。

<https://kubernetes.io/zh-cn/docs/setup/production-environment/container-runtimes/#systemd-cgroup-driver>

#### 将 systemd 配置为 containerd 的 cgroup 驱动

使用 containerd 作为 CRI 运行时的必要步骤。
在路径`/etc/containerd/config.toml`下找到配置文件。在 Linux 上，containerd 的默认 CRI 套接字是`/run/containerd/containerd.sock`。

结合 runc 使用 systemd cgroup 驱动，在 /etc/containerd/config.toml 中设置：
```
[plugins."io.containerd.grpc.v1.cri".containerd.runtimes.runc]
  ...
  [plugins."io.containerd.grpc.v1.cri".containerd.runtimes.runc.options]
    SystemdCgroup = true
```

> 说明：
> 如果你从软件包（例如，RPM 或者 .deb）中安装 containerd，你可能会发现其中默认禁止了 CRI 集成插件。
> 
> 你需要启用 CRI 支持才能在 Kubernetes 集群中使用 containerd。 要确保 cri 没有出现在 /etc/containerd/config.toml 文件中 disabled_plugins 列表内。如果你更改了这个文件，也请记得要重启 containerd。

如果你应用此更改，请确保重新启动 containerd：
```sh
sudo systemctl restart containerd
```




















---

## 在 Linux 系统中安装 kubectl 及其插件

### kubectl 的二进制安装

<https://kubernetes.io/zh-cn/docs/tasks/tools/install-kubectl-linux/#install-kubectl-binary-with-curl-on-linux>

```sh
# Make folder to save installation packages and configuration files.
mkdir -p /usr/nzhong/k8s && cd /usr/nzhong/k8s

# Download the latest stable version.
#curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
# Get the latest stable version.
#curl -L -s https://dl.k8s.io/release/stable.txt
# Download the particular version of "v1.26.0".
curl -LO https://dl.k8s.io/release/v1.26.0/bin/linux/amd64/kubectl
# Install kubectl.
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl

# Verify the installed version.
kubectl version --client

```

### 验证 kubectl 配置

为了让 kubectl 能发现并访问 Kubernetes 集群，你需要一个 kubeconfig 文件。
通常 kubectl 的配置信息存放于文件`~/.kube/config`中。

通过获取集群状态的方法，检查是否已恰当的配置了 kubectl，如果返回一个 URL，则意味着 kubectl 成功的访问到了你的集群。
```sh
kubectl cluster-info
```

### shell 自动补全功能

_TODO_

### 安装 kubectl convert 插件

kubectl-convert 允许你将清单在不同 API 版本间转换。
这对于将清单迁移到新的 Kubernetes 发行版上未被废弃的 API 版本时尤其有帮助。
```sh
# Download the latest kubectl-convert package.
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl-convert"
# Install kubectl-convert.
sudo install -o root -g root -m 0755 kubectl-convert /usr/local/bin/kubectl-convert
# Verify the installed version.
kubectl convert --help
```

---

## 使用 kubeadm 引导集群

**准备工作**

* Linux 主机。Kubernetes 项目为基于 Debian 和 Red Hat 的 Linux 发行版以及一些不提供包管理器的发行版提供通用的指令。
* 每台机器 2 GB 或更多的 RAM（如果少于这个数字将会影响你应用的运行内存）。
* CPU 2 核心及以上。
* 集群中的所有机器的网络彼此均能相互连接（公网和内网都可以）。
* 节点之中不可以有重复的主机名、MAC 地址或 product_uuid。
* 开启机器上的某些端口。
* 禁用交换分区。为了保证 kubelet 正常工作，你必须禁用交换分区。

### 确保每个节点上 MAC 地址和 product_uuid 的唯一性

通过命令`ip link`或`ifconfig -a`获取网络接口的 MAC 地址。

使用命令`sudo cat /sys/class/dmi/id/product_uuid`对 product_uuid 校验

**重命名主机名使节点方便管理**

```sh
# 建议手工操作
hostname ${NEW_HOSTNAME}
echo "${NEW_HOSTNAME}" > /etc/hostname
echo "HOSTNAME=${NEW_HOSTNAME}" >> /etc/sysconfig/network
echo "${IP_ADDRESS} ${NEW_HOSTNAME} ${NEW_HOSTNAME}" >> /etc/hosts
```

### 检查所需端口

可以使用 netcat 之类的工具来检查端口是否启用：
```sh
nc 127.0.0.1 6443
```

### 安装 kubeadm、kubelet

* **kubeadm**：用来初始化集群的指令。
* **kubelet**：在集群中的每个节点上用来启动 Pod 和容器等。
* **kubectl**：用来与集群通信的命令行工具。

基于 Red Hat 系发行版
```sh
# 配置yum repo，墙内用户可配置其他源
cat <<EOF | sudo tee /etc/yum.repos.d/kubernetes.repo
[kubernetes]
name=Kubernetes
baseurl=https://packages.cloud.google.com/yum/repos/kubernetes-el7-\$basearch
enabled=1
gpgcheck=1
gpgkey=https://packages.cloud.google.com/yum/doc/rpm-package-key.gpg
exclude=kubelet kubeadm kubectl
EOF

# Install epel-release as yum repo for CentOS 7 servers.
yum install https://dl.fedoraproject.org/pub/epel/epel-release-latest-7.noarch.rpm

# 将 SELinux 设置为 permissive 模式（相当于将其禁用）
# 通过运行命令 setenforce 0 和 sed ... 将 SELinux 设置为 permissive 模式可以有效地将其禁用。这是允许容器访问主机文件系统所必需的，而这些操作是为了例如 Pod 网络工作正常。
# 你必须这么做，直到 kubelet 做出对 SELinux 的支持进行升级为止。
sudo setenforce 0 && sudo sed -i 's/^SELINUX=enforcing$/SELINUX=permissive/' /etc/selinux/config
# 关闭虚拟内存分区，防止 k8s 的 pod 被分配到虚拟内存运行，从而影响产线运行效能。需要 reboot。
sudo swapoff -a && sudo sed -i '/ swap / s/^\(.*\)$/#\1/g' /etc/fstab

sudo yum install -y kubelet kubeadm --disableexcludes=kubernetes
sudo systemctl enable --now kubelet
```

### kubeadm 初始化集群

初始化 kubeadm 配置文件
```sh
# Make folder to save installation packages and configuration files.
mkdir -p /usr/nzhong/k8s/config && cd /usr/nzhong/k8s/config

# Export default init config.
kubeadm config print init-defaults > kubeadm-config-init-defaults.yaml
# Export default join config.
kubeadm config print join-defaults > kubeadm-config-join-defaults.yaml
```
根据 [kubeadm 配置 (v1beta3)](#kubeadm-v1beta3) 手工修改上述生成的默认配置文件，**删除你不确定的字段**。

#### kubeadm 配置 (v1beta3)

init-defaults
```yaml
apiVersion: kubeadm.k8s.io/v1beta3
bootstrapTokens:
- groups:
  - system:bootstrappers:kubeadm:default-node-token
  token: abcdef.0123456789abcdef
  ttl: 24h0m0s
  usages:
  - signing
  - authentication
kind: InitConfiguration
localAPIEndpoint:
  advertiseAddress: 1.2.3.4
  bindPort: 6443
nodeRegistration:
  criSocket: unix:///var/run/containerd/containerd.sock
  imagePullPolicy: IfNotPresent
  name: node
  taints: null
---
apiServer:
  timeoutForControlPlane: 4m0s
apiVersion: kubeadm.k8s.io/v1beta3
certificatesDir: /etc/kubernetes/pki
clusterName: kubernetes
controllerManager: {}
dns: {}
etcd:
  local:
    dataDir: /var/lib/etcd
imageRepository: registry.k8s.io
kind: ClusterConfiguration
kubernetesVersion: 1.26.0
networking:
  dnsDomain: cluster.local
  serviceSubnet: 10.96.0.0/12
scheduler: {}
```

更新
```yaml
apiVersion: kubeadm.k8s.io/v1beta3
kind: InitConfiguration
localAPIEndpoint:
  advertiseAddress: 10.225.36.57
  bindPort: 6443
nodeRegistration:
  criSocket: unix:///run/containerd/containerd.sock
  imagePullPolicy: IfNotPresent
  name: k8s-master-1
---
apiVersion: kubeadm.k8s.io/v1beta3
certificatesDir: /etc/kubernetes/pki
clusterName: nzhong-k8s-hz01
#controllerManager: {}
#dns: {}
apiServer:
  timeoutForControlPlane: 4m0s
etcd:
  local:
    imageRepository: "gcr.io/etcd-development"
    imageTag: "v3.4.23"
    dataDir: /var/lib/etcd
imageRepository: registry.k8s.io
kind: ClusterConfiguration
kubernetesVersion: 1.26.0
networking:
  dnsDomain: cluster.local
  serviceSubnet: 10.96.0.0/16
  podSubnet: 10.100.0.0/16
---
apiVersion: kubelet.config.k8s.io/v1beta1
kind: KubeletConfiguration
# kubelet specific options here
cgroupDriver: systemd
---
apiVersion: kubeproxy.config.k8s.io/v1alpha1
kind: KubeProxyConfiguration
```

#### 初始化控制平面(主控节点)

```sh
kubeadm init --config=kubeadm-init.yaml --upload-certs | tee kubeadm-log.log


mkdir -p $HOME/.kube
sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
sudo chown $(id -u):$(id -g) $HOME/.kube/config
```

root用户
```sh
export KUBECONFIG=/etc/kubernetes/admin.conf
```




#### CNI插件配置
```sh
cat << EOF | tee /etc/cni/net.d/10-containerd-net.conflist
{
 "cniVersion": "1.0.0",
 "name": "containerd-net",
 "plugins": [
   {
     "type": "bridge",
     "bridge": "cni0",
     "isGateway": true,
     "ipMasq": true,
     "promiscMode": true,
     "ipam": {
       "type": "host-local",
       "ranges": [
         [{
           "subnet": "10.96.0.0/16"
         }],
         [{
           "subnet": "10.100.0.0/16"
         }]
       ],
       "routes": [
         { "dst": "0.0.0.0/0" },
         { "dst": "::/0" }
       ]
     }
   },
   {
     "type": "portmap",
     "capabilities": {"portMappings": true},
     "externalSetMarkChain": "KUBE-MARK-MASQ"
   }
 ]
}
EOF
```