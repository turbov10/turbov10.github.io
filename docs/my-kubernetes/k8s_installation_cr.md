
# Kubernetes 容器运行时安装

你需要在集群内每个节点上安装一个**容器运行时**以使 Pod 可以运行在上面。
本文概述了所涉及的内容并描述了与节点设置相关的任务。

---

## 容器运行时环境安装 (containerd)

二进制安装：containerd, runc, CNI。
参考 [Getting started with containerd](https://github.com/containerd/containerd/blob/main/docs/getting-started.md)

### 1. 安装 containerd

下载 containerd 二进制包：<https://github.com/containerd/containerd/releases>。
包名的结构：`containerd-<VERSION>-<OS>-<ARCH>.tar.gz`。解压到`/usr/local`目录下
```sh
# Make folder to save installation packages and configuration files.
mkdir -p /usr/nzhong/containerd && cd /usr/nzhong/containerd

# Download the containerd package, from https://github.com/containerd/containerd/releases
wget https://github.com/containerd/containerd/releases/download/v1.6.12/containerd-1.6.12-linux-amd64.tar.gz
# Extract it under /usr/local
tar Cxzvf /usr/local containerd-1.6.12-linux-amd64.tar.gz
```

如果通过 **systemd** 启动 **containerd** ，
需要从 <https://raw.githubusercontent.com/containerd/containerd/main/containerd.service>
下载 `containerd.service` 单元到目录 `/etc/systemd/system/containerd.service` 下，然后：
```sh
# Download containerd.service for systemd.
wget https://raw.githubusercontent.com/containerd/containerd/main/containerd.service
# Copy Unit "containerd.service unit" to systemd directory.
cp ./containerd.service /etc/systemd/system/containerd.service
systemctl daemon-reload
systemctl enable --now containerd
```

### 2. 安装 runc

下载 runc 安装包：<https://github.com/opencontainers/runc/releases>。
包名的结构：`runc.<ARCH>`。安装到`/usr/local/sbin/runc`目录下。
```sh
# Make folder to save installation packages and configuration files.
mkdir -p /usr/nzhong/containerd && cd /usr/nzhong/containerd

# Download runc package by specific version of "v1.1.4".
wget https://github.com/opencontainers/runc/releases/download/v1.1.4/runc.amd64
# Install
install -m 755 runc.amd64 /usr/local/sbin/runc
```

验证 runc 安装 `runc --version`

如果缺少依赖包 `libseccomp` (尤其是 CentOS7 下 yum 下载安装的 `libseccomp` 版本<2.3，无法满足 containerd 的需求)。
此时需要安装高版本 libseccomp
```sh
# Make folder to save installation packages and configuration files.
mkdir -p /usr/nzhong/containerd && cd /usr/nzhong/containerd

# 查看所安装的 libseccomp 版本
rpm -qa | grep libseccomp
# 卸载低版本 libseccomp
# rpm -e libseccomp-2.3xxxxx --nodeps
# rpm -e libseccomp-2.3.1-4.el7.x86_64 --nodeps

wget http://rpmfind.net/linux/centos/8-stream/BaseOS/x86_64/os/Packages/libseccomp-2.5.1-1.el8.x86_64.rpm
rpm -ivh libseccomp-2.5.1-1.el8.x86_64.rpm
rpm -qa | grep libseccomp

runc --version
```

### 3. 安装 CNI 插件

下载 CNI 安装包：<https://github.com/containernetworking/plugins/releases>。
包名的结构：`cni-plugins-<OS>-<ARCH>-<VERSION>.tgz`。解压到`/opt/cni/bin`目录下。
```sh
# Make folder to save installation packages and configuration files.
mkdir -p /usr/nzhong/containerd && cd /usr/nzhong/containerd

# Download cni package by specific version of "v1.1.1".
wget https://github.com/containernetworking/plugins/releases/download/v1.1.1/cni-plugins-linux-amd64-v1.1.1.tgz

# Make directory and extract package.
mkdir -p /opt/cni/bin
tar Cxzvf /opt/cni/bin cni-plugins-linux-amd64-v1.1.1.tgz
```

### 4. 配置 containerd

containerd 通过配置文件`/etc/containerd/config.toml`来指定守护进程的配置。
[[配置参考](https://github.com/containerd/containerd/blob/main/docs/man/containerd-config.toml.5.md#etccontainerdconfigtoml-5-04052022)]

生成默认配置文件。
```sh
# Configure containerd with default options sample.
mkdir -p /etc/containerd
containerd config default > /etc/containerd/config.toml

systemctl restart containerd
```

查看安装状态
```sh
containerd -v

ctr version
```

### 5. 安装 nerdctl

```sh
# Make folder to save installation packages and configuration files.
mkdir -p /usr/nzhong/containerd && cd /usr/nzhong/containerd

wget https://github.com/containerd/nerdctl/releases/download/v1.1.0/nerdctl-1.1.0-linux-amd64.tar.gz
tar -zxvf nerdctl-1.1.0-linux-amd64.tar.gz nerdctl && mv nerdctl /usr/local/bin/

nerdctl version
```